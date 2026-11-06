import { describe, expect, test } from 'bun:test';
import {
  isDetachedPlaceholderCleanupEligible,
  isFailedOtpCleanupEligible,
} from '../convex/authCleanup';

const detachedPlaceholder = {
  userEmail: undefined,
  userEmailVerificationTime: undefined,
  hasProfile: false,
  hasAuthAccount: false,
  hasSession: false,
};

describe('isDetachedPlaceholderCleanupEligible', () => {
  test('allows only an empty user with nothing attached', () => {
    expect(isDetachedPlaceholderCleanupEligible(detachedPlaceholder)).toBe(
      true
    );
  });

  test.each([
    ['a user with an email', { userEmail: 'user@example.com' }],
    ['a verified user', { userEmailVerificationTime: 1 }],
    ['a profile owner', { hasProfile: true }],
    ['a user with an auth account', { hasAuthAccount: true }],
    ['a user with a session', { hasSession: true }],
  ])('rejects %s', (_name, changes) => {
    expect(
      isDetachedPlaceholderCleanupEligible({
        ...detachedPlaceholder,
        ...changes,
      })
    ).toBe(false);
  });
});

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
    [
      'a different normalized email',
      { providerAccountId: 'other@example.com' },
    ],
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
