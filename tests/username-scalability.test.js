import { describe, expect, test } from 'bun:test';
import { checkUsernameAvailable, createProfile } from '../convex/profiles';
import {
  applyApprovedUsernameMigrations,
  backfillNormalizedUsernames,
  resetUsernameVerification,
  verifyNormalizedUsernames,
} from '../convex/migrations';

// The handlers run unchanged against this bounded in-memory query surface. This
// models index equality and transaction retries, not the Convex storage engine.
function mockDatabase(profiles, otherTables = {}) {
  const tables = structuredClone({ profiles, ...otherTables });
  const reads = [];
  const db = {
    tables,
    reads,
    query(table) {
      let index;
      const constraints = [];
      const matches = (operation, limit) => {
        const result = (tables[table] ?? []).filter((row) =>
          constraints.every(([field, value]) => row[field] === value)
        );
        reads.push({
          table,
          index,
          operation,
          limit,
          constraints: [...constraints],
        });
        return result;
      };
      const query = {
        withIndex(name, callback) {
          index = name;
          const range = {
            eq(field, value) {
              constraints.push([field, value]);
              return range;
            },
          };
          callback?.(range);
          return query;
        },
        async first() {
          return matches('first', 1)[0] ?? null;
        },
        async unique() {
          const rows = matches('unique');
          if (rows.length > 1) throw new Error('Expected a unique row');
          return rows[0] ?? null;
        },
        async take(limit) {
          return matches('take', limit).slice(0, limit);
        },
        async paginate({ cursor, numItems }) {
          const rows = matches('paginate', numItems);
          const start = cursor === null ? 0 : Number(cursor);
          const page = rows.slice(start, start + numItems);
          return {
            page,
            isDone: start + page.length >= rows.length,
            continueCursor: String(start + page.length),
          };
        },
      };
      return query;
    },
    async get(id) {
      return (
        Object.values(tables)
          .flat()
          .find((row) => row._id === id) ?? null
      );
    },
    async insert(table, value) {
      tables[table] ??= [];
      const id = `${table}-${tables[table].length}`;
      tables[table].push({ ...value, _id: id });
      return id;
    },
    async patch(id, value) {
      const row = await db.get(id);
      if (!row) throw new Error(`Row not found: ${id}`);
      Object.assign(row, value);
    },
  };
  return db;
}

const normalizedProfiles = (count = 1200) =>
  Array.from({ length: count }, (_, index) => ({
    _id: `profile-${index}`,
    userId: `owner-${index}`,
    username: `person-${index}`,
    normalizedUsername: `person-${index}`,
  }));

const available = (db, username) =>
  checkUsernameAvailable._handler({ db }, { username });

const verify = (db, restart = false, numItems = 100) =>
  verifyNormalizedUsernames._handler({ db }, { restart, numItems });

const certificate = (db) => db.tables.usernameVerification?.[0];

async function certify(db) {
  let result = await verify(db, true);
  while (result.status === 'checking') result = await verify(db);
  return result;
}

const migrationArgs = (
  profileId,
  expectedCurrentUsername,
  approvedUsername,
  dryRun = false
) => ({
  entries: [{ profileId, expectedCurrentUsername, approvedUsername }],
  dryRun,
});

// A conservative OCC simulator: any intervening commit retries the entire real
// handler. Tests below deliberately pause just before commit to force races.
function transactions(initialTables) {
  let tables = structuredClone(initialTables);
  let revision = 0;
  return {
    get tables() {
      return tables;
    },
    async run(handler, args, { userId, beforeFirstCommit } = {}) {
      for (let attempt = 0; ; attempt += 1) {
        const snapshotRevision = revision;
        const db = mockDatabase(tables.profiles, tables);
        const result = await handler(
          {
            db,
            auth: { getUserIdentity: async () => ({ subject: userId }) },
          },
          args
        );
        if (attempt === 0 && beforeFirstCommit) await beforeFirstCommit();
        if (snapshotRevision !== revision) continue;
        tables = db.tables;
        revision += 1;
        return result;
      }
    },
  };
}

const deferred = () => {
  let resolve;
  const promise = new Promise((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
};

describe('paginated username certification', () => {
  test('certifies >1000 profiles and enables bounded indexed checks and creation', async () => {
    const db = mockDatabase(normalizedProfiles());
    const result = await certify(db);
    expect(result).toEqual({
      status: 'verified',
      checked: 1200,
      issues: 0,
      problemProfileIds: [],
    });
    db.reads.length = 0;
    expect(await available(db, '  New-Person ')).toBe(true);
    expect(await available(db, 'PERSON-1199')).toBe(false);
    await createProfile._handler(
      {
        db,
        auth: { getUserIdentity: async () => ({ subject: 'new-owner' }) },
      },
      { username: '  New-Person ', name: 'New Person' }
    );
    expect(await available(db, 'new-person')).toBe(false);
    expect(certificate(db).status).toBe('verified');
    expect(db.reads.every((read) => read.index)).toBe(true);
    expect(
      db.reads.every((read) => read.limit === undefined || read.limit <= 2)
    ).toBe(true);
  });

  test('does not use partial verification, and resumes persisted progress after a lost response', async () => {
    const db = mockDatabase(normalizedProfiles());
    await verify(db, true);
    expect(certificate(db).checked).toBe(100);
    await expect(available(db, 'new-person')).rejects.toThrow(
      'requires maintenance'
    );
    expect((await verify(db)).checked).toBe(200);
    expect((await verify(db, true)).checked).toBe(100);
    while (certificate(db).status === 'checking') await verify(db);
    expect(certificate(db).checked).toBe(1200);
    expect((await verify(db)).status).toBe('verified');
    expect(certificate(db).checked).toBe(1200);
  });

  test.each([
    [{ _id: 'missing', username: 'Alice' }],
    [{ _id: 'mismatch', username: 'Alice', normalizedUsername: 'wrong' }],
    [{ _id: 'invalid', username: '_alice', normalizedUsername: '_alice' }],
    [
      { _id: 'alice-1', username: 'Alice', normalizedUsername: 'alice' },
      { _id: 'alice-2', username: ' ALICE ', normalizedUsername: 'alice' },
    ],
    [
      { _id: 'alice-1', username: 'Alice' },
      { _id: 'alice-2', username: ' ALICE ' },
    ],
  ])(
    'never certifies incomplete, mismatched, invalid or duplicate identities: %j',
    async (...legacy) => {
      const db = mockDatabase([...normalizedProfiles(), ...legacy]);
      const result = await certify(db);
      expect(result.status).toBe('blocked');
      expect(result.issues).toBeGreaterThan(0);
      await expect(available(db, 'unused')).rejects.toThrow(
        'requires maintenance'
      );
    }
  );

  test('requires an explicit restart after a reset and validates page bounds', async () => {
    const db = mockDatabase(normalizedProfiles(1));
    await expect(verify(db)).rejects.toThrow('must be restarted');
    await certify(db);
    await resetUsernameVerification._handler({ db }, {});
    expect(certificate(db).status).toBe('unverified');
    await expect(verify(db)).rejects.toThrow('must be restarted');
    for (const size of [0, 101, 1.5]) {
      await expect(verify(db, true, size)).rejects.toThrow('batch size');
    }
    expect((await certify(db)).status).toBe('verified');
  });
});

describe('username handler collision safety', () => {
  test('normalizes checks and rejects indexed collisions', async () => {
    const db = mockDatabase(normalizedProfiles());
    expect(await available(db, '  PERSON-1199 ')).toBe(false);
    await expect(available(db, 'bad/name')).rejects.toThrow('Username must');
    expect(db.reads.every((read) => read.index)).toBe(true);
  });

  test('keeps case and whitespace legacy names reserved', async () => {
    const db = mockDatabase([
      { _id: 'legacy', username: '  Alice  ' },
      { _id: 'mismatch', username: 'BoB', normalizedUsername: 'wrong-name' },
    ]);
    expect(await available(db, 'alice')).toBe(false);
    expect(await available(db, 'bob')).toBe(false);
    expect(await available(db, 'unused')).toBe(true);
  });

  test('does not silently trust an unverified large dataset', async () => {
    const db = mockDatabase([
      ...normalizedProfiles(),
      { _id: 'late-mismatch', username: 'Alice', normalizedUsername: 'wrong' },
    ]);
    await expect(available(db, 'alice')).rejects.toThrow(
      'Username availability requires maintenance'
    );
  });

  test('creation normalizes and rechecks collisions inside its mutation', async () => {
    const db = mockDatabase([]);
    const ctx = {
      db,
      auth: { getUserIdentity: async () => ({ subject: 'owner-1' }) },
    };
    const id = await createProfile._handler(ctx, {
      username: '  Alice-Profile_2 ',
      name: 'Alice',
    });
    const profile = await db.get(id);
    expect(profile.username).toBe('alice-profile_2');
    expect(profile.normalizedUsername).toBe(profile.username);
    await expect(
      createProfile._handler(
        {
          db,
          auth: { getUserIdentity: async () => ({ subject: 'owner-2' }) },
        },
        { username: 'ALICE-PROFILE_2', name: 'Other' }
      )
    ).rejects.toThrow('Username already taken');
    expect(db.tables.profiles).toHaveLength(1);
  });

  test('a conflicting creation retry cannot claim the same normalized name', async () => {
    let committed = [];
    let revision = 0;
    let retries = 0;
    // Convex OCC retries a mutation when an indexed range it read changes.
    // Conservatively conflict on any commit here to exercise the real handler
    // again against committed state, rather than pretending a preflight is a lock.
    const transact = async (userId, username) => {
      for (;;) {
        const snapshotRevision = revision;
        const db = mockDatabase(committed);
        const result = await createProfile._handler(
          {
            db,
            auth: { getUserIdentity: async () => ({ subject: userId }) },
          },
          { username, name: userId }
        );
        if (revision !== snapshotRevision) {
          retries += 1;
          continue;
        }
        committed = db.tables.profiles;
        revision += 1;
        return result;
      }
    };
    const results = await Promise.allSettled([
      transact('owner-1', ' Alice '),
      transact('owner-2', 'ALICE'),
    ]);
    expect(retries).toBe(1);
    expect(
      results.filter((result) => result.status === 'fulfilled')
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === 'rejected').reason.message
    ).toBe('Username already taken');
    expect(committed.map((profile) => profile.normalizedUsername)).toEqual([
      'alice',
    ]);
  });
});

describe('username backfill handler safety', () => {
  test('backfills small legacy datasets, but requires certification/explicit repair above the ceiling', async () => {
    const db = mockDatabase([{ _id: 'legacy', username: '  Alice ' }]);
    expect((await certify(db)).status).toBe('blocked');
    const result = await backfillNormalizedUsernames._handler(
      { db },
      {
        paginationOpts: { cursor: null, numItems: 100 },
      }
    );
    expect(result.updated).toBe(1);
    expect((await db.get('legacy')).normalizedUsername).toBe('alice');
    expect((await certify(db)).status).toBe('verified');

    const large = mockDatabase([
      ...normalizedProfiles(),
      { _id: 'legacy', username: 'Alice' },
    ]);
    expect((await certify(large)).status).toBe('blocked');
    await expect(
      backfillNormalizedUsernames._handler(
        { db: large },
        {
          paginationOpts: { cursor: null, numItems: 100 },
        }
      )
    ).rejects.toThrow('requires maintenance');
    expect((await large.get('legacy')).normalizedUsername).toBeUndefined();

    // Model a separately reviewed, exact per-profile operator repair. No
    // production call or automatic repair bypass exists in these handlers.
    await resetUsernameVerification._handler({ db: large }, {});
    await large.patch('legacy', { normalizedUsername: 'alice' });
    expect((await certify(large)).status).toBe('verified');
    expect(await available(large, 'alice')).toBe(false);
    expect(await available(large, 'unused')).toBe(true);
  });

  test('backfill remains bounded and usable above 1000 after certification', async () => {
    const db = mockDatabase(normalizedProfiles());
    await certify(db);
    db.reads.length = 0;
    let cursor = null;
    let checked = 0;
    for (;;) {
      const result = await backfillNormalizedUsernames._handler(
        { db },
        {
          paginationOpts: { cursor, numItems: 100 },
        }
      );
      checked += result.checked;
      expect(result.updated).toBe(0);
      expect(result.collisions).toEqual([]);
      if (result.isDone) break;
      cursor = result.continueCursor;
    }
    expect(checked).toBe(1200);
    expect(certificate(db).status).toBe('verified');
    expect(
      db.reads.every((read) => read.index || read.operation === 'paginate')
    ).toBe(true);
    expect(
      db.reads.every((read) => read.limit === undefined || read.limit <= 100)
    ).toBe(true);
  });

  test('does not silently choose an owner for a legacy case collision', async () => {
    const db = mockDatabase([
      { _id: 'alice-1', username: 'Alice', normalizedUsername: 'alice' },
      { _id: 'alice-2', username: ' ALICE ' },
    ]);
    await verify(db, true, 1);
    const result = await backfillNormalizedUsernames._handler(
      { db },
      {
        paginationOpts: { cursor: null, numItems: 100 },
      }
    );
    expect(new Set(result.collisions)).toEqual(new Set(['alice-1', 'alice-2']));
    expect(
      db.tables.profiles.every(
        (profile) => profile.normalizedUsername === undefined
      )
    ).toBe(true);
    expect(certificate(db).status).toBe('unverified');
    expect(await available(db, 'alice')).toBe(false);
    expect((await certify(db)).status).toBe('blocked');
  });

  test('reports and preserves mismatched legacy reservations', async () => {
    const db = mockDatabase([
      { _id: 'mismatch', username: 'Alice', normalizedUsername: 'wrong-name' },
    ]);
    const result = await backfillNormalizedUsernames._handler(
      { db },
      { paginationOpts: { cursor: null, numItems: 100 } }
    );
    expect(result.collisions).toEqual(['mismatch']);
    expect(result.updated).toBe(0);
    expect(await db.get('mismatch')).toEqual({
      _id: 'mismatch',
      username: 'Alice',
      normalizedUsername: 'wrong-name',
    });
  });
});

describe('username identity writer verification protocol', () => {
  test('approved migration checks mismatched legacy identities, not only missing values', async () => {
    const db = mockDatabase(
      [
        {
          _id: 'source',
          userId: 'owner',
          username: 'source',
          normalizedUsername: 'source',
        },
        { _id: 'legacy', username: 'Alice', normalizedUsername: 'wrong' },
      ],
      { users: [{ _id: 'owner' }] }
    );
    const result = await applyApprovedUsernameMigrations._handler(
      { db },
      migrationArgs('source', 'source', 'alice')
    );
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain(
      'username_collision'
    );
    expect((await db.get('source')).username).toBe('source');
  });

  test('approved canonical migration preserves complete certification at scale', async () => {
    const db = mockDatabase(normalizedProfiles(), {
      users: [{ _id: 'owner-0' }],
    });
    await certify(db);
    db.reads.length = 0;
    const result = await applyApprovedUsernameMigrations._handler(
      { db },
      migrationArgs('profile-0', 'person-0', 'renamed-person')
    );
    expect(result.applied).toBe(1);
    expect(certificate(db).status).toBe('verified');
    expect(await available(db, 'person-0')).toBe(true);
    expect(await available(db, 'renamed-person')).toBe(false);
    expect(db.reads.every((read) => read.index)).toBe(true);
  });

  test('dry runs preserve progress; actual migration invalidates it even for an already-scanned profile', async () => {
    const db = mockDatabase(normalizedProfiles(2), {
      users: [{ _id: 'owner-0' }],
    });
    await verify(db, true, 1);
    const args = migrationArgs('profile-0', 'person-0', 'renamed-person', true);
    expect(
      (await applyApprovedUsernameMigrations._handler({ db }, args)).valid
    ).toBe(true);
    expect(certificate(db).status).toBe('checking');
    await applyApprovedUsernameMigrations._handler(
      { db },
      { ...args, dryRun: false }
    );
    expect(certificate(db).status).toBe('unverified');
    await expect(verify(db)).rejects.toThrow('must be restarted');
    expect((await certify(db)).status).toBe('verified');
  });

  test('backfill and creation invalidate an in-progress scan', async () => {
    const legacy = mockDatabase([
      { _id: 'legacy', username: 'Alice' },
      ...normalizedProfiles(1),
    ]);
    await verify(legacy, true, 1);
    await backfillNormalizedUsernames._handler(
      { db: legacy },
      {
        paginationOpts: { cursor: null, numItems: 100 },
      }
    );
    expect(certificate(legacy).status).toBe('unverified');
    expect((await certify(legacy)).status).toBe('verified');

    const db = mockDatabase(normalizedProfiles(2));
    await verify(db, true, 1);
    await createProfile._handler(
      {
        db,
        auth: {
          getUserIdentity: async () => ({ subject: 'new-owner' }),
        },
      },
      { username: 'new-person', name: 'New Person' }
    );
    expect(certificate(db).status).toBe('unverified');
    await expect(verify(db)).rejects.toThrow('must be restarted');
  });

  test('concurrent verifier pages serialize through persisted cursor state', async () => {
    const db = mockDatabase(normalizedProfiles(3));
    await verify(db, true, 1);
    const tx = transactions(db.tables);
    const results = await Promise.all([
      tx.run(verifyNormalizedUsernames._handler, {
        restart: false,
        numItems: 1,
      }),
      tx.run(verifyNormalizedUsernames._handler, {
        restart: false,
        numItems: 1,
      }),
    ]);
    expect(results.map((result) => result.checked).sort()).toEqual([2, 3]);
    expect(tx.tables.usernameVerification[0].status).toBe('verified');
  });

  test.each(['migration', 'creation'])(
    'a %s racing the last verification page prevents stale certification',
    async (writer) => {
      const db = mockDatabase(normalizedProfiles(2), {
        users: [{ _id: 'owner-0' }],
      });
      await verify(db, true, 1);
      const tx = transactions(db.tables);
      const pending = deferred();
      const release = deferred();
      const lastPage = tx.run(
        verifyNormalizedUsernames._handler,
        { restart: false, numItems: 1 },
        {
          beforeFirstCommit: async () => {
            pending.resolve();
            await release.promise;
          },
        }
      );
      await pending.promise;
      if (writer === 'migration') {
        await tx.run(
          applyApprovedUsernameMigrations._handler,
          migrationArgs('profile-0', 'person-0', 'renamed-person')
        );
      } else {
        await tx.run(
          createProfile._handler,
          { username: 'new-person', name: 'New Person' },
          { userId: 'new-owner' }
        );
      }
      release.resolve();
      await expect(lastPage).rejects.toThrow('must be restarted');
      expect(tx.tables.usernameVerification[0].status).toBe('unverified');
      expect(
        (
          await tx.run(verifyNormalizedUsernames._handler, {
            restart: true,
            numItems: 100,
          })
        ).status
      ).toBe('verified');
    }
  );
});
