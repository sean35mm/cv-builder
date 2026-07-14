import { describe, expect, test } from 'bun:test';
import { isFailedOtpCleanupEligible } from '../convex/authCleanup';

const eligiblePlaceholder = {
  accountProvider: 'email',
  providerAccountId: 'user@example.com',
  normalizedEmail: 'user@example.com',
  accountEmailVerified: undefined,
  userEmailVerificationTime: undefined,
  hasProfile: false,
  authAccountCount: 1,
  hasActiveSession: false,
  verificationCodeMatches: true,
};

describe('isFailedOtpCleanupEligible', () => {
  test('allows only the isolated unverified email placeholder', () => {
    expect(isFailedOtpCleanupEligible(eligiblePlaceholder)).toBe(true);
  });

  test.each([
    ['a different provider', { accountProvider: 'password' }],
    ['a different normalized email', { providerAccountId: 'other@example.com' }],
    ['a verified account', { accountEmailVerified: 'user@example.com' }],
    ['a verified user', { userEmailVerificationTime: 1 }],
    ['a profile owner', { hasProfile: true }],
    ['a legacy password credential', { authAccountCount: 2 }],
    ['an active session', { hasActiveSession: true }],
    ['a newer verification code', { verificationCodeMatches: false }],
  ])('rejects %s', (_name, changes) => {
    expect(
      isFailedOtpCleanupEligible({ ...eligiblePlaceholder, ...changes })
    ).toBe(false);
  });
});
