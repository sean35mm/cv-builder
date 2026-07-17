import { describe, expect, test } from 'bun:test';
import {
  PROFILE_CONFIGURE_LIMITS,
  profileConfigureLimitIdentity,
  rateLimitResponse,
  retryAfterSeconds,
} from '../lib/profile/configure-limit-policy';

describe('profile configure rate-limit policy', () => {
  test('uses the approved per-profile and global limits', () => {
    expect(PROFILE_CONFIGURE_LIMITS).toEqual({
      global: { rate: 30, periodMs: 60_000 },
      perUserProfile: { rate: 5, periodMs: 3_600_000 },
    });
  });

  test('builds a stable identity from server-derived user and profile IDs', () => {
    expect(profileConfigureLimitIdentity('user-1', 'profile-1')).toBe(
      'user-1:profile-1'
    );
    expect(() => profileConfigureLimitIdentity('', 'profile-1')).toThrow();
    expect(() => profileConfigureLimitIdentity('user-1', '')).toThrow();
  });

  test('converts retry delays to conservative whole seconds', () => {
    expect(retryAfterSeconds(1)).toBe(1);
    expect(retryAfterSeconds(1_001)).toBe(2);
    expect(retryAfterSeconds(Number.NaN)).toBe(1);
  });

  test('maps rate limits to a bounded retry response', () => {
    const response = rateLimitResponse(Number.MAX_VALUE);
    const retryAfter = Number(response.headers['Retry-After']);

    expect(response.status).toBe(429);
    expect(Number.isSafeInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(3_600);
  });
});
