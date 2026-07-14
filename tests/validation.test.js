import { describe, expect, test } from 'bun:test';
import {
  normalizeSectionsOrder,
  normalizeSectionsVisibility,
  normalizeUsername,
} from '../convex/validation';
import {
  findCaseInsensitiveUsernameMatches,
  isLegacyUsernameTaken,
  LEGACY_USERNAME_PREFLIGHT_LIMIT,
  USERNAME_MAINTENANCE_ERROR,
} from '../convex/usernameCollisions';

describe('username validation and collision policy', () => {
  test('normalizes valid usernames', () => {
    expect(normalizeUsername('  Alice-Profile_2 ')).toBe('alice-profile_2');
  });

  test('rejects invalid usernames', () => {
    for (const value of ['ab', '_alice', 'alice_', 'alice.profile']) {
      expect(() => normalizeUsername(value)).toThrow();
    }
  });

  test('matches legacy usernames case-insensitively', () => {
    const profiles = [
      { username: 'Alice' },
      { username: ' BOB ' },
      { username: 'charlie' },
    ];

    expect(findCaseInsensitiveUsernameMatches(profiles, 'alice')).toEqual([
      profiles[0],
    ]);
    expect(isLegacyUsernameTaken(profiles, 'bob')).toBe(true);
    expect(isLegacyUsernameTaken(profiles, 'dana')).toBe(false);
  });

  test('fails closed when the bounded legacy scan is incomplete', () => {
    const profiles = Array.from(
      { length: LEGACY_USERNAME_PREFLIGHT_LIMIT + 1 },
      (_, index) => ({ username: `legacy-${index}` })
    );

    expect(() => isLegacyUsernameTaken(profiles, 'unmatched')).toThrow(
      USERNAME_MAINTENANCE_ERROR
    );
  });
});

describe('section validators', () => {
  test('accepts a unique known section order', () => {
    expect(normalizeSectionsOrder(['header', 'bio', 'projects'])).toEqual([
      'header',
      'bio',
      'projects',
    ]);
  });

  test('rejects duplicate and unknown section order entries', () => {
    expect(() => normalizeSectionsOrder(['bio', 'bio'])).toThrow();
    expect(() => normalizeSectionsOrder(['header', 'private'])).toThrow();
  });

  test('accepts known visibility flags and rejects unknown sections', () => {
    expect(normalizeSectionsVisibility({ header: true, bio: false })).toEqual({
      header: true,
      bio: false,
    });
    expect(() =>
      normalizeSectionsVisibility({ header: true, private: false })
    ).toThrow();
  });
});
