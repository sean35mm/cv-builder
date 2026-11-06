import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { ConvexError } from 'convex/values';
// Convex Auth's own mutation implementations (pinned @convex-dev/auth), run
// against an in-memory database so the real account/code/session writes and
// callback ordering are exercised.
import { createVerificationCodeImpl } from '../node_modules/@convex-dev/auth/dist/server/implementation/mutations/createVerificationCode.js';
import { userOAuthImpl } from '../node_modules/@convex-dev/auth/dist/server/implementation/mutations/userOAuth.js';
import { verifyCodeAndSignInImpl } from '../node_modules/@convex-dev/auth/dist/server/implementation/mutations/verifyCodeAndSignIn.js';
import {
  createOrUpdateAuthUser,
  deleteDetachedPlaceholderUser,
} from '../convex/auth';
import { ACCOUNT_MATCH_ERROR } from '../convex/authLinking';
import { ensureAccountActive } from '../convex/deletion';
import { ResendOTP } from '../convex/ResendOTP';
import { stableRateLimitKey } from '../convex/rateLimitKey';
import { OTP_DELIVERY_FAILED } from '../lib/auth/otp-send-error';

const EMAIL = 'ada@example.com';

class FakeQuery {
  constructor(rows) {
    this.rows = rows;
  }
  withIndex(_name, build) {
    const conditions = [];
    const range = {
      eq(field, value) {
        conditions.push([field, value]);
        return range;
      },
    };
    build?.(range);
    return new FakeQuery(
      this.rows.filter((row) =>
        conditions.every(([field, value]) => row[field] === value)
      )
    );
  }
  filter() {
    throw new Error('FakeQuery.filter is not supported');
  }
  order() {
    return this;
  }
  async take(count) {
    return this.rows.slice(0, count);
  }
  async first() {
    return this.rows[0] ?? null;
  }
  async unique() {
    if (this.rows.length > 1) throw new Error('unique() matched several rows');
    return this.rows[0] ?? null;
  }
  async collect() {
    return [...this.rows];
  }
}

class FakeDb {
  constructor() {
    this.tables = new Map();
    this.nextId = 0;
  }
  table(name) {
    if (!this.tables.has(name)) this.tables.set(name, new Map());
    return this.tables.get(name);
  }
  rows(name) {
    return [...this.table(name).values()];
  }
  async insert(name, doc) {
    this.nextId += 1;
    const _id = `${name}|${this.nextId}`;
    const stored = { _creationTime: this.nextId };
    for (const [key, value] of Object.entries(doc)) {
      if (value !== undefined) stored[key] = value;
    }
    this.table(name).set(_id, { ...stored, _id });
    return _id;
  }
  async get(id) {
    return this.table(id.split('|')[0]).get(id) ?? null;
  }
  async patch(id, fields) {
    const doc = await this.get(id);
    if (!doc) throw new Error(`patch: missing ${id}`);
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) delete doc[key];
      else doc[key] = value;
    }
  }
  async delete(id) {
    this.table(id.split('|')[0]).delete(id);
  }
  query(name) {
    return new FakeQuery(this.rows(name));
  }
}

const providers = {
  email: ResendOTP,
  google: { id: 'google', type: 'oidc' },
};
const getProviderOrThrow = (id) => {
  const provider = providers[id];
  if (!provider) throw new Error(`Unknown provider ${id}`);
  return provider;
};

// Mirrors the callbacks registered in convex/auth.ts.
const config = {
  callbacks: {
    createOrUpdateUser: createOrUpdateAuthUser,
    beforeSessionCreation: (ctx, { userId }) =>
      ensureAccountActive(ctx, userId),
  },
};

const createHarness = () => {
  const db = new FakeDb();
  const scheduled = [];
  const rateLimitCalls = [];
  const harness = {
    db,
    scheduled,
    rateLimitCalls,
    rateLimitedNames: new Set(),
    ctx: {
      db,
      auth: { getUserIdentity: async () => null },
      scheduler: {
        runAfter: async (delay, _fn, args) => {
          scheduled.push({ delay, args });
        },
      },
      // Stands in for the @convex-dev/rate-limiter component mutation.
      runMutation: async (_fn, args) => {
        rateLimitCalls.push(args);
        if (harness.rateLimitedNames.has(args.name)) {
          throw new ConvexError({
            kind: 'RateLimited',
            name: args.name,
            retryAfter: 11 * 60 * 1000,
          });
        }
        return { ok: true, retryAfter: undefined };
      },
    },
  };
  return harness;
};

const signInWithGoogle = async (harness, sub = 'google-sub') => {
  const signature = `sig-${sub}`;
  await harness.db.insert('authVerifiers', { signature });
  const code = await userOAuthImpl(
    harness.ctx,
    {
      provider: 'google',
      providerAccountId: sub,
      profile: { email: EMAIL, emailVerified: true, name: 'Ada' },
      signature,
    },
    getProviderOrThrow,
    config
  );
  const verifier = harness.db
    .rows('authVerificationCodes')
    .find((row) => row.provider === 'google').verifier;
  return verifyCodeAndSignInImpl(
    harness.ctx,
    {
      params: { code },
      verifier,
      generateTokens: false,
      allowExtraProviders: false,
    },
    getProviderOrThrow,
    config
  );
};

const requestEmailCode = (harness, code) =>
  createVerificationCodeImpl(
    harness.ctx,
    {
      provider: 'email',
      email: EMAIL,
      code,
      expirationTime: Date.now() + 15 * 60 * 1000,
      allowExtraProviders: false,
    },
    getProviderOrThrow,
    config
  );

const verifyEmailCode = (harness, code) =>
  verifyCodeAndSignInImpl(
    harness.ctx,
    {
      params: { email: EMAIL, code },
      provider: 'email',
      generateTokens: false,
      allowExtraProviders: false,
    },
    getProviderOrThrow,
    config
  );

const emailAccount = (harness) =>
  harness.db
    .rows('authAccounts')
    .find((row) => row.provider === 'email' && row.providerAccountId === EMAIL);

const runScheduledCleanups = async (harness) => {
  const results = [];
  for (const { args } of harness.scheduled.splice(0)) {
    results.push(await deleteDetachedPlaceholderUser(harness, args.userId));
  }
  return results;
};

describe('OAuth sign-up, abandoned onboarding, then email code', () => {
  test('signs into the OAuth user instead of creating a second user', async () => {
    const harness = createHarness();
    const google = await signInWithGoogle(harness);
    expect(harness.db.rows('users')).toHaveLength(1);
    expect(harness.db.rows('profiles')).toHaveLength(0);

    await requestEmailCode(harness, '123456');
    // Convex Auth needs an account row to hold the code, so a placeholder
    // user exists until the code is verified.
    const placeholderId = emailAccount(harness).userId;
    expect(placeholderId).not.toBe(google.userId);

    const signedIn = await verifyEmailCode(harness, '123456');

    expect(signedIn.userId).toBe(google.userId);
    expect(emailAccount(harness).userId).toBe(google.userId);
    expect(emailAccount(harness).emailVerified).toBe(EMAIL);
    const session = await harness.db.get(signedIn.sessionId);
    expect(session.userId).toBe(google.userId);
    expect(harness.scheduled.map(({ args }) => args.userId)).toEqual([
      placeholderId,
    ]);

    expect(await runScheduledCleanups(harness)).toEqual([true]);
    expect(harness.db.rows('users').map((user) => user._id)).toEqual([
      google.userId,
    ]);

    // A later email code goes straight to the same user.
    await requestEmailCode(harness, '654321');
    expect(harness.db.rows('users')).toHaveLength(1);
    const again = await verifyEmailCode(harness, '654321');
    expect(again.userId).toBe(google.userId);
    expect(harness.scheduled).toHaveLength(0);
  });

  test('rejects an email code when several verified users share the email', async () => {
    const harness = createHarness();
    await signInWithGoogle(harness, 'google-1');
    await requestEmailCode(harness, '123456');
    // A second verified user for the address appears before the code is
    // entered (e.g. an older duplicate).
    await harness.db.insert('users', {
      email: EMAIL,
      emailVerificationTime: 1,
    });

    await expect(verifyEmailCode(harness, '123456')).rejects.toThrow(
      ACCOUNT_MATCH_ERROR
    );
    expect(harness.db.rows('authSessions')).toHaveLength(1);
  });

  test('refuses a first email code when several users share the email', async () => {
    const harness = createHarness();
    await signInWithGoogle(harness, 'google-1');
    await harness.db.insert('users', {
      email: EMAIL,
      emailVerificationTime: 1,
    });

    await expect(requestEmailCode(harness, '123456')).rejects.toThrow(
      ACCOUNT_MATCH_ERROR
    );
    expect(emailAccount(harness)).toBeUndefined();
  });

  test('never adopts an unverified user with the same email', async () => {
    const harness = createHarness();
    const squatterId = await harness.db.insert('users', { email: EMAIL });

    await requestEmailCode(harness, '123456');
    const placeholderId = emailAccount(harness).userId;
    const signedIn = await verifyEmailCode(harness, '123456');

    expect(signedIn.userId).toBe(placeholderId);
    expect(signedIn.userId).not.toBe(squatterId);
    expect(harness.scheduled).toHaveLength(0);
    expect((await harness.db.get(squatterId)).emailVerificationTime).toBe(
      undefined
    );
  });

  test('keeps an existing verified email-code user and its duplicate', async () => {
    const harness = createHarness();
    const google = await signInWithGoogle(harness);
    const duplicateId = await harness.db.insert('users', {
      email: EMAIL,
      emailVerificationTime: 1,
    });
    await harness.db.insert('authAccounts', {
      userId: duplicateId,
      provider: 'email',
      providerAccountId: EMAIL,
      emailVerified: EMAIL,
    });

    await requestEmailCode(harness, '123456');
    const signedIn = await verifyEmailCode(harness, '123456');

    expect(signedIn.userId).toBe(duplicateId);
    expect(harness.scheduled).toHaveLength(0);
    expect(await harness.db.get(google.userId)).not.toBeNull();
    expect(await harness.db.get(duplicateId)).not.toBeNull();
  });
});

describe('detached placeholder cleanup', () => {
  test('keeps a user that gained an account, session, profile, or email', async () => {
    for (const attach of [
      (db, userId) =>
        db.insert('authAccounts', {
          userId,
          provider: 'email',
          providerAccountId: EMAIL,
        }),
      (db, userId) => db.insert('authSessions', { userId, expirationTime: 1 }),
      (db, userId) => db.insert('profiles', { userId }),
      (db, userId) => db.patch(userId, { email: EMAIL }),
    ]) {
      const db = new FakeDb();
      const userId = await db.insert('users', {});
      await attach(db, userId);
      expect(await deleteDetachedPlaceholderUser({ db }, userId)).toBe(false);
      expect(await db.get(userId)).not.toBeNull();
    }
  });
});

describe('email code send admission', () => {
  test('consumes the recipient and global limits before storing a code', async () => {
    const harness = createHarness();
    await requestEmailCode(harness, '123456');

    expect(harness.rateLimitCalls.map(({ name, key }) => [name, key])).toEqual([
      ['otpSendPerRecipient', await stableRateLimitKey('otp-recipient', EMAIL)],
      ['otpSendGlobal', undefined],
    ]);
    expect(harness.rateLimitCalls.every(({ throws }) => throws)).toBe(true);
  });

  test('a rate-limited resend leaves the previous code usable', async () => {
    const harness = createHarness();
    await requestEmailCode(harness, '111111');
    const codesBefore = harness.db.rows('authVerificationCodes');

    harness.rateLimitedNames.add('otpSendPerRecipient');
    const rejected = await requestEmailCode(harness, '222222').catch(
      (error) => error
    );
    expect(rejected).toBeInstanceOf(ConvexError);
    expect(rejected.data).toMatchObject({
      kind: 'RateLimited',
      retryAfter: 11 * 60 * 1000,
    });
    expect(harness.db.rows('authVerificationCodes')).toEqual(codesBefore);

    harness.rateLimitedNames.clear();
    const signedIn = await verifyEmailCode(harness, '111111');
    expect(signedIn?.userId).toBe(emailAccount(harness).userId);
  });

  test('a rate-limited first send creates no placeholder user or account', async () => {
    const harness = createHarness();
    harness.rateLimitedNames.add('otpSendGlobal');

    await expect(requestEmailCode(harness, '123456')).rejects.toBeInstanceOf(
      ConvexError
    );
    expect(harness.db.rows('users')).toHaveLength(0);
    expect(harness.db.rows('authAccounts')).toHaveLength(0);
    expect(harness.db.rows('authVerificationCodes')).toHaveLength(0);
  });
});

describe('email code delivery failure', () => {
  const saved = {};

  beforeEach(() => {
    saved.fetch = globalThis.fetch;
    saved.key = process.env.AUTH_RESEND_KEY;
    saved.from = process.env.AUTH_EMAIL;
    process.env.AUTH_RESEND_KEY = 'test-only-key';
    process.env.AUTH_EMAIL = 'OpenCV <login@example.test>';
  });

  afterEach(() => {
    globalThis.fetch = saved.fetch;
    if (saved.key === undefined) delete process.env.AUTH_RESEND_KEY;
    else process.env.AUTH_RESEND_KEY = saved.key;
    if (saved.from === undefined) delete process.env.AUTH_EMAIL;
    else process.env.AUTH_EMAIL = saved.from;
  });

  test('reports OtpDeliveryFailed and requests cleanup of the unsent code', async () => {
    const requests = [];
    globalThis.fetch = async (url) => {
      requests.push(String(url));
      return new Response(JSON.stringify({ name: 'validation_error' }), {
        status: 422,
      });
    };
    const mutations = [];
    const ctx = {
      runMutation: async (_fn, args) => {
        mutations.push(args);
        return null;
      },
    };

    const error = await ResendOTP.sendVerificationRequest(
      { identifier: ' Ada@Example.com ', token: '123456' },
      ctx
    ).catch((caught) => caught);

    expect(error).toBeInstanceOf(ConvexError);
    expect(error.data).toEqual({ kind: OTP_DELIVERY_FAILED });
    expect(requests).toEqual(['https://api.resend.com/emails']);
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode('123456')
    );
    const hash = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');
    // Only the cleanup mutation runs; rate limits were enforced earlier.
    expect(mutations).toEqual([{ email: EMAIL, verificationCodeHash: hash }]);
  });
});
