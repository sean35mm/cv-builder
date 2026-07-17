import { describe, expect, test } from 'bun:test';
import {
  classifyUsernameAuditRecord,
  planExplicitUsernameMigrations,
  USERNAME_MIGRATION_MAX_BATCH_SIZE,
} from '../convex/usernameMaintenance';
import {
  assertBoundedLegacyProfileSample,
  findLegacyNormalizedUsernameConflicts,
  LEGACY_USERNAME_PREFLIGHT_LIMIT,
} from '../convex/usernameCollisions';

describe('username maintenance classification', () => {
  test('classifies missing, mismatched, invalid, and colliding usernames', () => {
    const missing = classifyUsernameAuditRecord(
      { profileId: 'profile-missing', username: ' Alice ' },
      false
    );
    expect(missing.record.expectedNormalizedUsername).toBe('alice');
    expect(missing.missingNormalizedUsername).toBe(true);
    expect(missing.mismatch).toBe(false);
    expect(missing.invalidUsername).toBe(false);

    const mismatch = classifyUsernameAuditRecord(
      {
        profileId: 'profile-mismatch',
        username: 'Alice',
        normalizedUsername: 'bob',
      },
      true
    );
    expect(mismatch.mismatch).toBe(true);
    expect(mismatch.normalizedCollision).toBe(true);

    const invalid = classifyUsernameAuditRecord(
      { profileId: 'profile-invalid', username: '_legacy' },
      false
    );
    expect(invalid.invalidUsername).toBe(true);
  });
});

describe('explicit username migration planning', () => {
  const entry = {
    profileId: 'profile-1',
    expectedCurrentUsername: '_legacy',
    approvedUsername: 'legacy-safe',
  };

  test('plans only an explicitly approved normalized replacement', () => {
    const plan = planExplicitUsernameMigrations([entry], [
      {
        profileId: 'profile-1',
        currentUsername: '_legacy',
        ownerExists: true,
        normalizedConflictProfileIds: [],
        exactConflictProfileIds: [],
      },
    ]);

    expect(plan.errors).toEqual([]);
    expect(plan.plannedChanges).toEqual([
      {
        profileId: 'profile-1',
        expectedCurrentUsername: '_legacy',
        approvedUsername: 'legacy-safe',
        previousNormalizedUsername: undefined,
      },
    ]);
  });

  test('is idempotent after the approved change is already present', () => {
    const plan = planExplicitUsernameMigrations([entry], [
      {
        profileId: 'profile-1',
        currentUsername: 'legacy-safe',
        currentNormalizedUsername: 'legacy-safe',
        ownerExists: true,
        normalizedConflictProfileIds: ['profile-1'],
        exactConflictProfileIds: ['profile-1'],
      },
    ]);

    expect(plan).toEqual({ plannedChanges: [], errors: [] });
  });

  test('rejects collisions, missing ownership, and non-normalized replacements', () => {
    const collision = planExplicitUsernameMigrations([entry], [
      {
        profileId: 'profile-1',
        currentUsername: '_legacy',
        ownerExists: false,
        normalizedConflictProfileIds: ['profile-2'],
        exactConflictProfileIds: [],
      },
    ]);
    expect(collision.errors.map((error) => error.code)).toEqual([
      'owner_not_found',
      'username_collision',
    ]);

    const invalid = planExplicitUsernameMigrations(
      [{ ...entry, approvedUsername: 'Legacy-Safe' }],
      [
        {
          profileId: 'profile-1',
          currentUsername: '_legacy',
          ownerExists: true,
          normalizedConflictProfileIds: [],
          exactConflictProfileIds: [],
        },
      ]
    );
    expect(invalid.errors.map((error) => error.code)).toContain(
      'invalid_approved_username'
    );
    expect(invalid.plannedChanges).toEqual([]);
  });

  test('rejects a case-insensitive collision from a legacy missing-normalized profile', () => {
    const legacyConflicts = findLegacyNormalizedUsernameConflicts(
      [{ _id: 'profile-legacy-alice', username: 'Alice' }],
      ['alice']
    );
    const plan = planExplicitUsernameMigrations(
      [{ ...entry, approvedUsername: 'alice' }],
      [
        {
          profileId: 'profile-1',
          currentUsername: '_legacy',
          ownerExists: true,
          normalizedConflictProfileIds: legacyConflicts.get('alice'),
          exactConflictProfileIds: [],
        },
      ]
    );

    expect(plan.errors.map((error) => error.code)).toContain(
      'username_collision'
    );
  });

  test('fails closed when the bounded legacy collision probe overflows', () => {
    expect(() =>
      assertBoundedLegacyProfileSample(
        Array.from({ length: LEGACY_USERNAME_PREFLIGHT_LIMIT + 1 })
      )
    ).toThrow('Username availability requires maintenance');
  });

  test('does not migrate a directory projection implicitly', () => {
    const plan = planExplicitUsernameMigrations([entry], [
      {
        profileId: 'profile-1',
        currentUsername: '_legacy',
        ownerExists: true,
        hasDirectoryProjection: true,
        normalizedConflictProfileIds: [],
        exactConflictProfileIds: [],
      },
    ]);

    expect(plan.errors.map((error) => error.code)).toContain(
      'directory_projection_present'
    );
    expect(plan.plannedChanges).toEqual([]);
  });

  test('enforces the migration batch limit', () => {
    const entries = Array.from(
      { length: USERNAME_MIGRATION_MAX_BATCH_SIZE + 1 },
      (_, index) => ({
        profileId: `profile-${index}`,
        expectedCurrentUsername: `legacy-${index}`,
        approvedUsername: `approved-${index}`,
      })
    );

    const plan = planExplicitUsernameMigrations(entries, []);
    expect(plan.plannedChanges).toEqual([]);
    expect(plan.errors).toEqual([
      expect.objectContaining({ code: 'invalid_batch_size' }),
    ]);
  });
});
