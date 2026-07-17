import { normalizeUsername } from './validation';

export const LEGACY_USERNAME_PREFLIGHT_LIMIT = 1000;
export const USERNAME_MAINTENANCE_ERROR =
  'Username availability requires maintenance. Please contact support.';

export function assertBoundedLegacyProfileSample<T>(
  profiles: T[],
  limit = LEGACY_USERNAME_PREFLIGHT_LIMIT
): void {
  if (profiles.length > limit) {
    throw new Error(USERNAME_MAINTENANCE_ERROR);
  }
}

export function findLegacyNormalizedUsernameConflicts<
  T extends { _id: string; username: string },
>(profiles: T[], approvedUsernames: Iterable<string>): Map<string, T['_id'][]> {
  const approvedTargets = new Set(approvedUsernames);
  const conflicts = new Map<string, T['_id'][]>();
  for (const target of approvedTargets) conflicts.set(target, []);
  for (const profile of profiles) {
    let normalizedUsername: string;
    try {
      normalizedUsername = normalizeUsername(profile.username);
    } catch {
      continue;
    }
    if (!approvedTargets.has(normalizedUsername)) continue;
    conflicts.get(normalizedUsername)?.push(profile._id);
  }
  return conflicts;
}

export function findCaseInsensitiveUsernameMatches<
  T extends { username: string },
>(profiles: T[], normalizedUsername: string): T[] {
  return profiles.filter(
    (profile) => profile.username.trim().toLowerCase() === normalizedUsername
  );
}

export function isLegacyUsernameTaken<T extends { username: string }>(
  profiles: T[],
  normalizedUsername: string
): boolean {
  if (
    findCaseInsensitiveUsernameMatches(profiles, normalizedUsername).length > 0
  ) {
    return true;
  }
  if (profiles.length > LEGACY_USERNAME_PREFLIGHT_LIMIT) {
    throw new Error(USERNAME_MAINTENANCE_ERROR);
  }
  return false;
}
