import { normalizeUsername } from './validation';

export const USERNAME_AUDIT_MAX_PAGE_SIZE = 100;
export const USERNAME_MIGRATION_MAX_BATCH_SIZE = 50;

export type UsernameAuditInput<T extends string = string> = {
  profileId: T;
  username: string;
  normalizedUsername?: string;
};

export type UsernameAuditClassification<T extends string = string> = {
  record: UsernameAuditInput<T> & { expectedNormalizedUsername: string };
  missingNormalizedUsername: boolean;
  mismatch: boolean;
  invalidUsername: boolean;
  normalizedCollision: boolean;
};

export const expectedNormalizedUsername = (username: string): string =>
  username.trim().toLowerCase();

export const isSafeNormalizedUsername = (username: string): boolean => {
  try {
    return normalizeUsername(username) === username;
  } catch {
    return false;
  }
};

export function classifyUsernameAuditRecord<T extends string>(
  profile: UsernameAuditInput<T>,
  normalizedCollision: boolean
): UsernameAuditClassification<T> {
  const expected = expectedNormalizedUsername(profile.username);
  return {
    record: { ...profile, expectedNormalizedUsername: expected },
    missingNormalizedUsername: profile.normalizedUsername === undefined,
    mismatch:
      profile.normalizedUsername !== undefined &&
      profile.normalizedUsername !== expected,
    invalidUsername: !isSafeNormalizedUsername(expected),
    normalizedCollision,
  };
}

export type ExplicitUsernameMigrationEntry<T extends string = string> = {
  profileId: T;
  expectedCurrentUsername: string;
  approvedUsername: string;
};

export type ExplicitUsernameMigrationState<T extends string = string> = {
  profileId: T;
  currentUsername?: string;
  currentNormalizedUsername?: string;
  ownerExists: boolean;
  hasDirectoryProjection?: boolean;
  normalizedConflictProfileIds: T[];
  exactConflictProfileIds: T[];
};

export type ExplicitUsernameMigrationError<T extends string = string> = {
  entryIndex: number;
  profileId?: T;
  code: string;
  message: string;
};

export type PlannedUsernameMigration<T extends string = string> = {
  profileId: T;
  expectedCurrentUsername: string;
  approvedUsername: string;
  previousNormalizedUsername?: string;
};

export function planExplicitUsernameMigrations<T extends string>(
  entries: ExplicitUsernameMigrationEntry<T>[],
  states: ExplicitUsernameMigrationState<T>[]
): {
  plannedChanges: PlannedUsernameMigration<T>[];
  errors: ExplicitUsernameMigrationError<T>[];
} {
  const errors: ExplicitUsernameMigrationError<T>[] = [];
  const plannedChanges: PlannedUsernameMigration<T>[] = [];

  if (
    !Number.isInteger(entries.length) ||
    entries.length < 1 ||
    entries.length > USERNAME_MIGRATION_MAX_BATCH_SIZE
  ) {
    errors.push({
      entryIndex: -1,
      code: 'invalid_batch_size',
      message: `Username migration batch size must be between 1 and ${USERNAME_MIGRATION_MAX_BATCH_SIZE}`,
    });
    return { plannedChanges, errors };
  }

  const stateByProfileId = new Map(
    states.map((state) => [state.profileId, state])
  );
  const profileIdCounts = new Map<T, number>();
  const approvedUsernameCounts = new Map<string, number>();
  for (const entry of entries) {
    profileIdCounts.set(
      entry.profileId,
      (profileIdCounts.get(entry.profileId) ?? 0) + 1
    );
    approvedUsernameCounts.set(
      entry.approvedUsername,
      (approvedUsernameCounts.get(entry.approvedUsername) ?? 0) + 1
    );
  }

  entries.forEach((entry, entryIndex) => {
    const entryErrors: ExplicitUsernameMigrationError<T>[] = [];
    const addError = (code: string, message: string) => {
      entryErrors.push({ entryIndex, profileId: entry.profileId, code, message });
    };

    if ((profileIdCounts.get(entry.profileId) ?? 0) > 1) {
      addError('duplicate_profile', 'Profile appears more than once in the batch');
    }
    if ((approvedUsernameCounts.get(entry.approvedUsername) ?? 0) > 1) {
      addError(
        'duplicate_approved_username',
        'Approved username appears more than once in the batch'
      );
    }
    if (!isSafeNormalizedUsername(entry.approvedUsername)) {
      addError(
        'invalid_approved_username',
        'Approved username must already be normalized and safe'
      );
    }

    const state = stateByProfileId.get(entry.profileId);
    if (state?.currentUsername === undefined) {
      addError('profile_not_found', 'Profile does not exist');
    } else {
      const alreadyApplied =
        state.currentUsername === entry.approvedUsername &&
        state.currentNormalizedUsername === entry.approvedUsername;
      if (!state.ownerExists) {
        addError('owner_not_found', 'Profile ownership record does not exist');
      }
      if (state.hasDirectoryProjection && !alreadyApplied) {
        addError(
          'directory_projection_present',
          'Profile has a directory projection that requires a separately approved migration'
        );
      }
      if (
        state.currentUsername !== entry.expectedCurrentUsername &&
        state.currentUsername !== entry.approvedUsername
      ) {
        addError(
          'current_username_mismatch',
          'Current username does not match the expected value'
        );
      }
      const conflicts = new Set([
        ...state.normalizedConflictProfileIds,
        ...state.exactConflictProfileIds,
      ]);
      conflicts.delete(entry.profileId);
      if (conflicts.size > 0) {
        addError(
          'username_collision',
          'Approved username conflicts with another profile'
        );
      }
    }

    errors.push(...entryErrors);
    if (
      entryErrors.length === 0 &&
      state?.currentUsername === entry.expectedCurrentUsername &&
      (state.currentUsername !== entry.approvedUsername ||
        state.currentNormalizedUsername !== entry.approvedUsername)
    ) {
      plannedChanges.push({
        profileId: entry.profileId,
        expectedCurrentUsername: entry.expectedCurrentUsername,
        approvedUsername: entry.approvedUsername,
        previousNormalizedUsername: state.currentNormalizedUsername,
      });
    }
  });

  return { plannedChanges, errors };
}
