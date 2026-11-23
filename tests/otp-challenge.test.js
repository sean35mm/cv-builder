import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { ConvexError } from 'convex/values';
import {
  consumeOtpChallengePass,
  issueOtpChallengePass,
  OTP_CHALLENGE_PASS_TTL_MS,
  otpChallengeKey,
  requestOtpChallengePass,
  TURNSTILE_SITEVERIFY_URL,
  verifyTurnstileToken,
} from '../convex/otpChallenge';
import {
  assertOtpRecipientAllowed,
  CARRIER_SMS_GATEWAY_DOMAINS,
  canonicalOtpEmail,
  isCarrierSmsGateway,
} from '../convex/otpRecipient';
import { normalizeEmail } from '../convex/validation';
import {
  classifyOtpSendError,
  OTP_CHALLENGE_FAILED,
  OTP_RECIPIENT_BLOCKED,
} from '../lib/auth/otp-send-error';

// Cloudflare's documented dummy token for its test secrets.
const DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

class PassQuery {
  constructor(rows) {
    this.rows = rows;
  }
  withIndex(name, build) {
    const tests = [];
    const range = {
      eq(field, value) {
        tests.push((row) => row[field] === value);
        return range;
      },
      lt(field, value) {
        tests.push((row) => row[field] < value);
        return range;
      },
    };
    build(range);
    this.index = name;
    return new PassQuery(this.rows.filter((row) => tests.every((t) => t(row))));
  }
  async take(count) {
    return this.rows.slice(0, count);
  }
}

class PassDb {
  constructor() {
    this.rows = new Map();
    this.nextId = 0;
  }
  query(table) {
    expect(table).toBe('otpChallengePasses');
    return new PassQuery([...this.rows.values()]);
  }
  async insert(table, doc) {
    expect(table).toBe('otpChallengePasses');
    this.nextId += 1;
    const _id = `pass|${this.nextId}`;
    this.rows.set(_id, { ...doc, _id });
    return _id;
  }
  async delete(id) {
    this.rows.delete(id);
  }
  all() {
    return [...this.rows.values()];
  }
}

describe('canonicalOtpEmail', () => {
  test('collapses Gmail dot, plus-tag, and googlemail variants', () => {
    for (const variant of [
      'adalovelace@gmail.com',
      'ada.love.lace@gmail.com',
      'a.d.a.l.o.v.e.l.a.c.e@gmail.com',
      'Ada.Lovelace+signup@Gmail.com',
      'adalovelace+x.y@googlemail.com',
      ' ADA.LOVELACE@GOOGLEMAIL.COM ',
    ]) {
      expect(canonicalOtpEmail(variant)).toBe('adalovelace@gmail.com');
    }
  });

  test('leaves other providers alone apart from case', () => {
    expect(canonicalOtpEmail('Ada.Lovelace+cv@Example.com')).toBe(
      'ada.lovelace+cv@example.com'
    );
    expect(canonicalOtpEmail('a.b@outlook.com')).toBe('a.b@outlook.com');
    expect(canonicalOtpEmail('a.b@mail.gmail.com')).toBe('a.b@mail.gmail.com');
  });

  test('does not change the account identifier', () => {
    expect(normalizeEmail('Ada.Lovelace+cv@Gmail.com')).toBe(
      'ada.lovelace+cv@gmail.com'
    );
  });

  test('gives every dot variant one challenge-pass key', async () => {
    const key = await otpChallengeKey('adalovelace@gmail.com');
    expect(await otpChallengeKey('a.da.lo.ve.lace@gmail.com')).toBe(key);
    expect(await otpChallengeKey('adalovelace+1@googlemail.com')).toBe(key);
    expect(await otpChallengeKey('adalovelace@example.com')).not.toBe(key);
    expect(key).toStartWith('otp-challenge:');
    expect(key).not.toContain('ada');
  });
});

describe('carrier SMS gateway block', () => {
  test.each(CARRIER_SMS_GATEWAY_DOMAINS)('blocks %s', (domain) => {
    const email = `5555550123@${domain}`;
    expect(isCarrierSmsGateway(email)).toBe(true);
    const error = (() => {
      try {
        assertOtpRecipientAllowed(email);
      } catch (caught) {
        return caught;
      }
    })();
    expect(error).toBeInstanceOf(ConvexError);
    expect(error.data).toEqual({ kind: OTP_RECIPIENT_BLOCKED });
    expect(classifyOtpSendError(error)).toEqual({ kind: 'recipientBlocked' });
  });

  test('blocks subdomains and mixed case', () => {
    expect(isCarrierSmsGateway('5555550123@VText.com')).toBe(true);
    expect(isCarrierSmsGateway('x@sub.tmomail.net')).toBe(true);
  });

  test('allows ordinary addresses and look-alike domains', () => {
    for (const email of [
      'ada@gmail.com',
      'ada@google.com',
      'ada@att.net',
      'ada@notvtext.com',
      'ada@vtext.com.example',
    ]) {
      expect(isCarrierSmsGateway(email)).toBe(false);
      expect(() => assertOtpRecipientAllowed(email)).not.toThrow();
    }
  });

  test('stays out of normalizeEmail so OAuth sign-in is unaffected', () => {
    expect(normalizeEmail('5555550123@vtext.com')).toBe('5555550123@vtext.com');
  });
});

describe('verifyTurnstileToken', () => {
  test('accepts a successful siteverify response', async () => {
    const calls = [];
    const fetchImpl = async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({ success: true, 'error-codes': [] });
    };

    expect(
      await verifyTurnstileToken('secret-value', DUMMY_TOKEN, fetchImpl)
    ).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(TURNSTILE_SITEVERIFY_URL);
    expect(calls[0].init.method).toBe('POST');
    const body = new URLSearchParams(calls[0].init.body);
    expect(body.get('secret')).toBe('secret-value');
    expect(body.get('response')).toBe(DUMMY_TOKEN);
  });

  test('rejects a failed siteverify response with its error codes', async () => {
    const fetchImpl = async () =>
      jsonResponse({
        success: false,
        'error-codes': ['invalid-input-response', 7],
      });

    expect(await verifyTurnstileToken('s', DUMMY_TOKEN, fetchImpl)).toEqual({
      ok: false,
      reason: 'rejected',
      errorCodes: ['invalid-input-response'],
    });
  });

  test('fails closed on a network error, HTTP error, or bad body', async () => {
    const network = async () => {
      throw new TypeError('fetch failed');
    };
    expect(await verifyTurnstileToken('s', DUMMY_TOKEN, network)).toEqual({
      ok: false,
      reason: 'unavailable',
      errorCodes: [],
    });

    const serverError = async () => new Response('oops', { status: 503 });
    expect(await verifyTurnstileToken('s', DUMMY_TOKEN, serverError)).toEqual({
      ok: false,
      reason: 'unavailable',
      errorCodes: ['http-503'],
    });

    const notJson = async () => new Response('<html>', { status: 200 });
    expect(
      (await verifyTurnstileToken('s', DUMMY_TOKEN, notJson)).ok
    ).toBeFalse();

    const truthyNotTrue = async () => jsonResponse({ success: 'true' });
    expect(
      (await verifyTurnstileToken('s', DUMMY_TOKEN, truthyNotTrue)).ok
    ).toBeFalse();
  });

  test('rejects an empty or oversized token without calling Cloudflare', async () => {
    let called = false;
    const fetchImpl = async () => {
      called = true;
      return jsonResponse({ success: true });
    };
    for (const token of ['', 'x'.repeat(2049)]) {
      expect(await verifyTurnstileToken('s', token, fetchImpl)).toEqual({
        ok: false,
        reason: 'invalid',
        errorCodes: [],
      });
    }
    expect(called).toBe(false);
  });
});

describe('challenge passes', () => {
  const NOW = 1_800_000_000_000;

  test('a pass is used once', async () => {
    const db = new PassDb();
    await issueOtpChallengePass(db, 'k', NOW);
    expect(db.all()).toEqual([
      { _id: 'pass|1', key: 'k', expiresAt: NOW + OTP_CHALLENGE_PASS_TTL_MS },
    ]);

    expect(await consumeOtpChallengePass(db, 'k', NOW + 1000)).toBe(true);
    expect(db.all()).toHaveLength(0);
    expect(await consumeOtpChallengePass(db, 'k', NOW + 2000)).toBe(false);
  });

  test('a pass for another address does not count', async () => {
    const db = new PassDb();
    await issueOtpChallengePass(db, 'k1', NOW);
    expect(await consumeOtpChallengePass(db, 'k2', NOW)).toBe(false);
    expect(db.all()).toHaveLength(1);
  });

  test('an expired pass is refused and deleted', async () => {
    const db = new PassDb();
    await issueOtpChallengePass(db, 'k', NOW);
    expect(
      await consumeOtpChallengePass(db, 'k', NOW + OTP_CHALLENGE_PASS_TTL_MS)
    ).toBe(false);
    expect(db.all()).toHaveLength(0);
  });

  test('issuing replaces the earlier pass for the same key', async () => {
    const db = new PassDb();
    await issueOtpChallengePass(db, 'k', NOW);
    await issueOtpChallengePass(db, 'k', NOW + 5000);
    expect(db.all()).toEqual([
      {
        _id: 'pass|2',
        key: 'k',
        expiresAt: NOW + 5000 + OTP_CHALLENGE_PASS_TTL_MS,
      },
    ]);
  });

  test('issuing sweeps expired passes left by other addresses', async () => {
    const db = new PassDb();
    for (let index = 0; index < 30; index += 1) {
      await issueOtpChallengePass(db, `old-${index}`, NOW);
    }
    await issueOtpChallengePass(db, 'live', NOW + 1000);
    const later = NOW + OTP_CHALLENGE_PASS_TTL_MS + 1;
    await issueOtpChallengePass(db, 'new', later);

    // One sweep is bounded to 25 rows; the next issue clears the rest.
    expect(db.all().filter((row) => row.key.startsWith('old-'))).toHaveLength(
      5
    );
    expect(db.all().some((row) => row.key === 'live')).toBe(true);
    await issueOtpChallengePass(db, 'newer', later);
    expect(
      db
        .all()
        .map((row) => row.key)
        .sort()
    ).toEqual(['live', 'new', 'newer']);
  });
});

describe('requestOtpChallengePass action', () => {
  const saved = {};
  let warn;

  beforeEach(() => {
    saved.fetch = globalThis.fetch;
    saved.secret = process.env.TURNSTILE_SECRET_KEY;
    warn = spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = saved.fetch;
    if (saved.secret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = saved.secret;
    warn.mockRestore();
  });

  const harness = () => {
    const mutations = [];
    const fetches = [];
    globalThis.fetch = async (url, init) => {
      fetches.push({ url: String(url), body: String(init.body) });
      return harness.response();
    };
    return {
      mutations,
      fetches,
      ctx: {
        runMutation: async (_fn, args) => {
          mutations.push(args);
          return null;
        },
      },
    };
  };
  harness.response = () => jsonResponse({ success: true });

  test('is a no-op with a warning while TURNSTILE_SECRET_KEY is unset', async () => {
    for (const unset of [undefined, '', '   ']) {
      if (unset === undefined) delete process.env.TURNSTILE_SECRET_KEY;
      else process.env.TURNSTILE_SECRET_KEY = unset;
      const run = harness();
      await expect(
        requestOtpChallengePass._handler(run.ctx, {
          email: 'ada@example.com',
          turnstileToken: '',
        })
      ).resolves.toBeNull();
      expect(run.fetches).toHaveLength(0);
      expect(run.mutations).toHaveLength(0);
    }
    expect(warn).toHaveBeenCalledTimes(3);
  });

  test('stores a pass keyed by the canonical email after verification', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
    harness.response = () => jsonResponse({ success: true });
    const run = harness();

    await requestOtpChallengePass._handler(run.ctx, {
      email: ' A.D.A@GMAIL.com ',
      turnstileToken: DUMMY_TOKEN,
    });

    expect(run.fetches).toHaveLength(1);
    expect(run.mutations).toEqual([
      { key: await otpChallengeKey('ada@gmail.com') },
    ]);
  });

  test('throws OtpChallengeFailed and stores nothing when Cloudflare says no', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
    harness.response = () =>
      jsonResponse({
        success: false,
        'error-codes': ['invalid-input-response'],
      });
    const run = harness();

    const error = await requestOtpChallengePass
      ._handler(run.ctx, {
        email: 'ada@example.com',
        turnstileToken: DUMMY_TOKEN,
      })
      .catch((caught) => caught);

    expect(error).toBeInstanceOf(ConvexError);
    expect(error.data).toEqual({ kind: OTP_CHALLENGE_FAILED });
    expect(classifyOtpSendError(error)).toEqual({ kind: 'challengeFailed' });
    expect(run.mutations).toHaveLength(0);
  });

  test('refuses an SMS gateway before calling Cloudflare', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
    const run = harness();

    const error = await requestOtpChallengePass
      ._handler(run.ctx, {
        email: '5555550123@vtext.com',
        turnstileToken: DUMMY_TOKEN,
      })
      .catch((caught) => caught);

    expect(error.data).toEqual({ kind: OTP_RECIPIENT_BLOCKED });
    expect(run.fetches).toHaveLength(0);
    expect(run.mutations).toHaveLength(0);
  });
});
