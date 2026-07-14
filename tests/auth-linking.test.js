import { describe, expect, test } from 'bun:test';
import {
  ACCOUNT_MATCH_ERROR,
  selectAuthLinkingDecision,
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
});
