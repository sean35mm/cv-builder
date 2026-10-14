import { describe, expect, test } from 'bun:test';
import {
  ACCOUNT_MATCH_ERROR,
  OAUTH_UNVERIFIED_EMAIL_ERROR,
  selectAuthLinkingDecision,
  selectOAuthLinkingDecision,
} from '../convex/authLinking';

describe('selectAuthLinkingDecision', () => {
  test('retains an existing profile owner', () => {
    expect(
      selectAuthLinkingDecision(
        [{ userId: 'existing', hasProfile: true }],
        'existing',
        undefined
      )
    ).toEqual({ userId: 'existing', cleanupCandidateId: null });
  });

  test('selects exactly one legacy password profile owner', () => {
    expect(
      selectAuthLinkingDecision(
        [
          { userId: 'placeholder', hasProfile: false },
          { userId: 'legacy', hasProfile: true },
        ],
        'placeholder',
        'legacy'
      )
    ).toEqual({ userId: 'legacy', cleanupCandidateId: null });
  });

  test('does not link a verified OTP identity to an unprofiled password user', () => {
    expect(
      selectAuthLinkingDecision(
        [
          { userId: 'placeholder', hasProfile: false },
          { userId: 'legacy-password', hasProfile: false },
        ],
        'placeholder',
        'legacy-password'
      )
    ).toEqual({ userId: 'placeholder', cleanupCandidateId: null });
  });

  test('rejects ambiguous profile owners', () => {
    expect(() =>
      selectAuthLinkingDecision(
        [
          { userId: 'placeholder', hasProfile: false },
          { userId: 'legacy-1', hasProfile: true },
          { userId: 'legacy-2', hasProfile: true },
        ],
        'placeholder',
        'legacy-1'
      )
    ).toThrow(ACCOUNT_MATCH_ERROR);
  });

  test('identifies a detached placeholder cleanup candidate only when safe', () => {
    const candidates = [
      { userId: 'placeholder', hasProfile: false },
      { userId: 'legacy', hasProfile: true },
    ];

    expect(
      selectAuthLinkingDecision(candidates, 'placeholder', 'legacy', {
        userId: 'placeholder',
        emailVerified: false,
      }).cleanupCandidateId
    ).toBe('placeholder');
    expect(
      selectAuthLinkingDecision(candidates, 'placeholder', 'legacy', {
        userId: 'placeholder',
        emailVerified: true,
      }).cleanupCandidateId
    ).toBeNull();
    expect(
      selectAuthLinkingDecision(candidates, 'placeholder', 'legacy', {
        userId: 'someone-else',
        emailVerified: false,
      }).cleanupCandidateId
    ).toBeNull();
  });

  test('links a verified email code to a verified profile owner', () => {
    expect(
      selectAuthLinkingDecision(
        [
          { userId: 'placeholder', hasProfile: false },
          { userId: 'google-user', hasProfile: true, emailVerified: true },
        ],
        'placeholder',
        undefined
      )
    ).toEqual({ userId: 'google-user', cleanupCandidateId: null });
  });

  test('still rejects an unverified non-password profile owner', () => {
    expect(() =>
      selectAuthLinkingDecision(
        [
          { userId: 'placeholder', hasProfile: false },
          { userId: 'other', hasProfile: true, emailVerified: false },
        ],
        'placeholder',
        undefined
      )
    ).toThrow(ACCOUNT_MATCH_ERROR);
  });
});

describe('selectOAuthLinkingDecision', () => {
  const email = 'ada@example.com';

  test('rejects an unverified or missing provider email', () => {
    expect(() => selectOAuthLinkingDecision(email, false, [])).toThrow(
      OAUTH_UNVERIFIED_EMAIL_ERROR
    );
    expect(() => selectOAuthLinkingDecision(email, 'true', [])).toThrow(
      OAUTH_UNVERIFIED_EMAIL_ERROR
    );
    expect(() => selectOAuthLinkingDecision(undefined, true, [])).toThrow(
      OAUTH_UNVERIFIED_EMAIL_ERROR
    );
  });

  test('creates a new user when nothing matches', () => {
    expect(selectOAuthLinkingDecision(email, true, [])).toBeNull();
  });

  test('links exactly one verified match', () => {
    expect(
      selectOAuthLinkingDecision(email, true, [
        {
          userId: 'otp-user',
          email: 'Ada@Example.com',
          hasProfile: false,
          emailVerified: true,
        },
      ])
    ).toBe('otp-user');
  });

  test('links a legacy password user with a profile', () => {
    const legacy = {
      userId: 'legacy',
      email,
      hasProfile: true,
      emailVerified: false,
    };
    // Found by both the email index and the password account lookup.
    expect(selectOAuthLinkingDecision(email, true, [legacy, legacy])).toBe(
      'legacy'
    );
  });

  test('does not link a never-verified password user without a profile', () => {
    expect(() =>
      selectOAuthLinkingDecision(email, true, [
        { userId: 'dormant', email, hasProfile: false, emailVerified: false },
      ])
    ).toThrow(ACCOUNT_MATCH_ERROR);
  });

  test('throws when several users match', () => {
    expect(() =>
      selectOAuthLinkingDecision(email, true, [
        { userId: 'a', email, hasProfile: true, emailVerified: true },
        { userId: 'b', email, hasProfile: false, emailVerified: true },
      ])
    ).toThrow(ACCOUNT_MATCH_ERROR);
  });

  test('never matches a placeholder without an email', () => {
    expect(
      selectOAuthLinkingDecision(email, true, [
        { userId: 'placeholder', hasProfile: false, emailVerified: false },
      ])
    ).toBeNull();
  });
});
