import { normalizeUsername } from '@/convex/validation';

export const USERNAME_MAX_LENGTH = 30;

// Same rule the server enforces, so the client never queries with a value
// that makes checkUsernameAvailable throw.
export function isValidUsername(value: string): boolean {
  try {
    normalizeUsername(value);
    return true;
  } catch {
    return false;
  }
}

export function cleanUsernameInput(raw: string): string {
  return raw
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, USERNAME_MAX_LENGTH);
}
