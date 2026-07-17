export const PASSCODE_MIN_CODE_POINTS = 10;
export const PASSCODE_MAX_CODE_POINTS = 128;

const CONTROL_CHARACTER_PATTERN = /\p{Cc}|\p{Cf}/u;
const ARGON2ID_HASH_PATTERN =
  /^\$argon2id\$v=19\$m=65536,t=3,p=1\$[A-Za-z0-9+/]{22}\$[A-Za-z0-9+/]{43}$/;

export const normalizeProfilePasscode = (passcode: unknown): string => {
  if (typeof passcode !== 'string') throw new Error('Passcode is invalid');
  const normalized = passcode.normalize('NFC');
  const length = Array.from(normalized).length;
  if (
    length < PASSCODE_MIN_CODE_POINTS ||
    length > PASSCODE_MAX_CODE_POINTS ||
    CONTROL_CHARACTER_PATTERN.test(normalized)
  ) {
    throw new Error('Passcode is invalid');
  }
  return normalized;
};

export const isProfilePasscodeHash = (value: unknown): value is string =>
  typeof value === 'string' && ARGON2ID_HASH_PATTERN.test(value);
