import { describe, expect, test } from 'bun:test';
import {
  ABANDONED_PLACEHOLDER_MAX_CODES,
  ABANDONED_PLACEHOLDER_MIN_AGE_MS,
  classifyAbandonedPlaceholder,
} from '../convex/authCleanup';
import {
  cleanupAbandonedPlaceholders,
  previewAbandonedPlaceholders,
} from '../convex/placeholderCleanup';
import crons from '../convex/crons';

const NOW = 100 * 86400000;
const OLD = NOW - ABANDONED_PLACEHOLDER_MIN_AGE_MS - 1;

const abandoned = {
  now: NOW,
  userCreationTime: OLD,
  hasProfile: false,
  hasSession: false,
  hasOwnedRecords: false,
  accounts: [{ provider: 'email' }],
  verificationCodeExpirations: [NOW - 1],
};

describe('classifyAbandonedPlaceholder', () => {
  test('deletes an old unverified email-code placeholder', () => {
    expect(classifyAbandonedPlaceholder(abandoned)).toBe(
      'deleteEmailCodePlaceholder'
    );
  });

  test('deletes when the code row is already gone', () => {
    expect(
      classifyAbandonedPlaceholder({
        ...abandoned,
        verificationCodeExpirations: [],
      })
    ).toBe('deleteEmailCodePlaceholder');
  });

  test('deletes an old detached placeholder with no account', () => {
    expect(
      classifyAbandonedPlaceholder({
        ...abandoned,
        accounts: [],
        verificationCodeExpirations: [],
      })
    ).toBe('deleteDetachedPlaceholder');
  });

  test.each([
    [
      'a user with an email',
      { userEmail: 'user@example.invalid' },
      'keepHasIdentity',
    ],
    ['a user with a phone', { userPhone: '+10000000000' }, 'keepHasIdentity'],
    ['a verified user', { userEmailVerificationTime: 1 }, 'keepVerified'],
    ['a phone-verified user', { userPhoneVerificationTime: 1 }, 'keepVerified'],
    ['a profile owner', { hasProfile: true }, 'keepHasProfile'],
    ['a session holder', { hasSession: true }, 'keepHasSession'],
    [
      'an owner of uploads or jobs',
      { hasOwnedRecords: true },
      'keepHasOwnedRecords',
    ],
    [
      'someone mid-sign-in (<24h old)',
      { userCreationTime: NOW - ABANDONED_PLACEHOLDER_MIN_AGE_MS + 1 },
      'keepTooRecent',
    ],
    [
      'a detached user under 24h old',
      {
        userCreationTime: NOW - 1000,
        accounts: [],
        verificationCodeExpirations: [],
      },
      'keepTooRecent',
    ],
    [
      'an old placeholder with an unexpired code (re-requested sign-in)',
      { verificationCodeExpirations: [NOW - 1, NOW + 60_000] },
      'keepPendingCode',
    ],
    [
      'an account with too many codes to judge',
      {
        verificationCodeExpirations: Array(
          ABANDONED_PLACEHOLDER_MAX_CODES + 1
        ).fill(NOW - 1),
      },
      'keepPendingCode',
    ],
    [
      'an OAuth user',
      { accounts: [{ provider: 'google', emailVerified: 'x' }] },
      'keepAccountShape',
    ],
    [
      'an OAuth user without a verified email',
      { accounts: [{ provider: 'linkedin' }] },
      'keepAccountShape',
    ],
    [
      'a password user',
      { accounts: [{ provider: 'password' }] },
      'keepAccountShape',
    ],
    [
      'a user with two accounts',
      { accounts: [{ provider: 'email' }, { provider: 'google' }] },
      'keepAccountShape',
    ],
    [
      'a verified email account',
      { accounts: [{ provider: 'email', emailVerified: 'x' }] },
      'keepAccountShape',
    ],
  ])('keeps %s', (_name, changes, reason) => {
    expect(classifyAbandonedPlaceholder({ ...abandoned, ...changes })).toBe(
      reason
    );
  });

  test('checks identity before age so real recent users are never deleted', () => {
    expect(
      classifyAbandonedPlaceholder({
        ...abandoned,
        userCreationTime: NOW,
        userEmail: 'user@example.invalid',
      })
    ).toBe('keepHasIdentity');
  });
});

// Minimal in-memory Convex database covering the reads the cleanup performs.
function createFakeCtx(tables) {
  const rows = Object.fromEntries(
    Object.entries(tables).map(([name, list]) => [name, [...list]])
  );
  const scheduled = [];
  const deleted = [];
  const ensure = (name) => (rows[name] ??= []);
  const db = {
    query(table) {
      const list = ensure(table);
      return {
        withIndex(_name, range) {
          const filters = [];
          range({
            eq(field, value) {
              filters.push([field, value]);
              return this;
            },
          });
          const matches = () =>
            list.filter((row) =>
              filters.every(([field, value]) => row[field] === value)
            );
          return {
            first: async () => matches()[0] ?? null,
            take: async (n) => matches().slice(0, n),
          };
        },
        async paginate({ numItems, cursor }) {
          const sorted = [...list].sort(
            (a, b) => a._creationTime - b._creationTime
          );
          const start = cursor === null ? 0 : Number(cursor);
          const page = sorted.slice(start, start + numItems);
          const end = start + page.length;
          return {
            page,
            isDone: end >= sorted.length,
            continueCursor: String(end),
          };
        },
      };
    },
    async delete(id) {
      for (const [name, list] of Object.entries(rows)) {
        const index = list.findIndex((row) => row._id === id);
        if (index !== -1) {
          list.splice(index, 1);
          deleted.push(`${name}:${id}`);
          return;
        }
      }
      throw new Error(`missing ${id}`);
    },
  };
  return {
    ctx: {
      db,
      scheduler: {
        runAfter: async (delay, _ref, args) => {
          scheduled.push({ delay, args });
        },
      },
    },
    rows,
    scheduled,
    deleted,
  };
}

function liveLikeData(now) {
  const old = now - ABANDONED_PLACEHOLDER_MIN_AGE_MS - 60_000;
  const recent = now - 60_000;
  return {
    users: [
      { _id: 'u-placeholder', _creationTime: old },
      { _id: 'u-detached', _creationTime: old + 1 },
      {
        _id: 'u-verified',
        _creationTime: old + 2,
        email: 'a@example.invalid',
        emailVerificationTime: old,
      },
      { _id: 'u-oauth', _creationTime: old + 3 },
      { _id: 'u-profile', _creationTime: old + 4 },
      { _id: 'u-session', _creationTime: old + 5 },
      { _id: 'u-two-accounts', _creationTime: old + 6 },
      { _id: 'u-pending', _creationTime: old + 7 },
      { _id: 'u-upload', _creationTime: old + 8 },
      { _id: 'u-recent', _creationTime: recent },
    ],
    authAccounts: [
      { _id: 'a-placeholder', userId: 'u-placeholder', provider: 'email' },
      {
        _id: 'a-verified',
        userId: 'u-verified',
        provider: 'email',
        emailVerified: 'a@example.invalid',
      },
      { _id: 'a-oauth', userId: 'u-oauth', provider: 'google' },
      { _id: 'a-profile', userId: 'u-profile', provider: 'email' },
      { _id: 'a-session', userId: 'u-session', provider: 'email' },
      { _id: 'a-two-1', userId: 'u-two-accounts', provider: 'email' },
      { _id: 'a-two-2', userId: 'u-two-accounts', provider: 'email' },
      { _id: 'a-pending', userId: 'u-pending', provider: 'email' },
      { _id: 'a-upload', userId: 'u-upload', provider: 'email' },
      { _id: 'a-recent', userId: 'u-recent', provider: 'email' },
    ],
    authVerificationCodes: [
      { _id: 'c-placeholder', accountId: 'a-placeholder', expirationTime: old },
      {
        _id: 'c-pending',
        accountId: 'a-pending',
        expirationTime: now + 60_000,
      },
      { _id: 'c-recent', accountId: 'a-recent', expirationTime: now + 60_000 },
    ],
    authSessions: [{ _id: 's-session', userId: 'u-session' }],
    profiles: [{ _id: 'p-profile', userId: 'u-profile' }],
    uploadedFiles: [{ _id: 'f-upload', userId: 'u-upload' }],
    uploadSessions: [],
    deletionJobs: [],
    authRateLimits: [{ _id: 'r-1', identifier: 'x' }],
  };
}

describe('cleanupAbandonedPlaceholders', () => {
  test('deletes only abandoned placeholders and keeps real accounts', async () => {
    const now = Date.now();
    const { ctx, rows, scheduled, deleted } = createFakeCtx(liveLikeData(now));
    const result = await cleanupAbandonedPlaceholders._handler(ctx, {});

    expect(deleted.sort()).toEqual(
      [
        'authAccounts:a-placeholder',
        'authVerificationCodes:c-placeholder',
        'users:u-detached',
        'users:u-placeholder',
      ].sort()
    );
    expect(result.deletedUsers).toBe(2);
    expect(result.deletedAccounts).toBe(1);
    expect(result.deletedVerificationCodes).toBe(1);
    expect(result.counts).toMatchObject({
      deleteEmailCodePlaceholder: 1,
      deleteDetachedPlaceholder: 1,
      keepHasIdentity: 1,
      keepHasProfile: 1,
      keepHasSession: 1,
      keepHasOwnedRecords: 1,
      keepAccountShape: 2,
      keepPendingCode: 1,
      keepTooRecent: 1,
    });
    expect(rows.users.map((u) => u._id)).toEqual([
      'u-verified',
      'u-oauth',
      'u-profile',
      'u-session',
      'u-two-accounts',
      'u-pending',
      'u-upload',
      'u-recent',
    ]);
    expect(rows.authRateLimits).toHaveLength(1);
    expect(scheduled).toHaveLength(0);

    // Idempotent: a second run deletes nothing.
    const again = await cleanupAbandonedPlaceholders._handler(ctx, {});
    expect(again.deletedUsers).toBe(0);
    expect(deleted).toHaveLength(4);
  });

  test('schedules the next page until it reaches recent users', async () => {
    const now = Date.now();
    const old = now - ABANDONED_PLACEHOLDER_MIN_AGE_MS - 60_000;
    const users = Array.from({ length: 150 }, (_, i) => ({
      _id: `u-${i}`,
      _creationTime: old + i,
      email: `user${i}@example.invalid`,
    }));
    const first = createFakeCtx({ users });
    const page1 = await cleanupAbandonedPlaceholders._handler(first.ctx, {});
    expect(page1.scanned).toBe(100);
    expect(page1.scheduledNext).toBe(true);
    expect(first.scheduled).toEqual([{ delay: 0, args: { cursor: '100' } }]);

    const page2 = await cleanupAbandonedPlaceholders._handler(first.ctx, {
      cursor: '100',
    });
    expect(page2.scanned).toBe(50);
    expect(page2.isDone).toBe(true);
    expect(page2.scheduledNext).toBe(false);

    // The 100th user is under 24h old, so every later user is too.
    const withRecent = createFakeCtx({
      users: users.map((user, i) =>
        i < 99 ? user : { ...user, _creationTime: now - 1000 + i }
      ),
    });
    const stopped = await cleanupAbandonedPlaceholders._handler(
      withRecent.ctx,
      {}
    );
    expect(stopped.isDone).toBe(false);
    expect(stopped.scheduledNext).toBe(false);
    expect(withRecent.scheduled).toHaveLength(0);
  });

  test('dry run returns counts only and deletes nothing', async () => {
    const now = Date.now();
    const { ctx, deleted } = createFakeCtx(liveLikeData(now));
    ctx.db.delete = async () => {
      throw new Error('dry run must not delete');
    };
    const result = await previewAbandonedPlaceholders._handler(ctx, {});
    expect(deleted).toHaveLength(0);
    expect(result.scanned).toBe(10);
    expect(result.counts.deleteEmailCodePlaceholder).toBe(1);
    expect(result.counts.deleteDetachedPlaceholder).toBe(1);
    expect(JSON.stringify(result)).not.toContain('example.invalid');
    expect(JSON.stringify(result)).not.toContain('u-');
  });
});

test('cleanup is registered as a daily cron', () => {
  const job = crons.crons['abandoned sign-in placeholder cleanup'];
  expect(job).toBeDefined();
  expect(job.schedule.type).toBe('daily');
});
