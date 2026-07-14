export const LEGACY_USERNAME_PREFLIGHT_LIMIT = 1000;
export const USERNAME_MAINTENANCE_ERROR =
  'Username availability requires maintenance. Please contact support.';

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
