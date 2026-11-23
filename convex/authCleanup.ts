export type FailedOtpCleanupEligibility = {
  accountProvider: string;
  providerAccountId: string;
  normalizedEmail: string;
  accountEmailVerified?: unknown;
  userEmailVerificationTime?: number;
  hasProfile: boolean;
  authAccountCount: number;
  hasActiveSession: boolean;
  verificationCodeMatches: boolean;
};

export type DetachedPlaceholderCleanupEligibility = {
  userEmail?: string;
  userEmailVerificationTime?: number;
  hasProfile: boolean;
  hasAuthAccount: boolean;
  hasSession: boolean;
};

// Only the empty user row an email-code request creates, after its account
// moved to the user it was linked to, may be deleted.
export function isDetachedPlaceholderCleanupEligible(
  input: DetachedPlaceholderCleanupEligibility
): boolean {
  return (
    input.userEmail === undefined &&
    input.userEmailVerificationTime === undefined &&
    !input.hasProfile &&
    !input.hasAuthAccount &&
    !input.hasSession
  );
}

export function isFailedOtpCleanupEligible(
  input: FailedOtpCleanupEligibility
): boolean {
  return (
    input.accountProvider === 'email' &&
    input.providerAccountId === input.normalizedEmail &&
    input.accountEmailVerified === undefined &&
    input.userEmailVerificationTime === undefined &&
    !input.hasProfile &&
    input.authAccountCount === 1 &&
    !input.hasActiveSession &&
    input.verificationCodeMatches
  );
}

export const ABANDONED_PLACEHOLDER_MIN_AGE_MS = 24 * 60 * 60 * 1000;
// More codes than this on one account is not what Convex Auth produces; keep it.
export const ABANDONED_PLACEHOLDER_MAX_CODES = 5;

export type AbandonedPlaceholderInput = {
  now: number;
  userCreationTime: number;
  userEmail?: string;
  userEmailVerificationTime?: number;
  userPhone?: string;
  userPhoneVerificationTime?: number;
  hasProfile: boolean;
  hasSession: boolean;
  // Uploads, upload sessions or deletion jobs owned by the user.
  hasOwnedRecords: boolean;
  // Up to two of the user's auth accounts; two means "more than one".
  accounts: Array<{
    provider: string;
    emailVerified?: unknown;
    phoneVerified?: unknown;
  }>;
  // Expiration times of the single account's verification codes, bounded by
  // ABANDONED_PLACEHOLDER_MAX_CODES + 1 reads.
  verificationCodeExpirations: number[];
};

export type AbandonedPlaceholderDecision =
  | 'deleteEmailCodePlaceholder'
  | 'deleteDetachedPlaceholder'
  | 'keepHasIdentity'
  | 'keepVerified'
  | 'keepHasProfile'
  | 'keepHasSession'
  | 'keepHasOwnedRecords'
  | 'keepTooRecent'
  | 'keepAccountShape'
  | 'keepPendingCode';

// Decides whether a user row is an abandoned email sign-in placeholder: the
// empty user an unverified email-code request creates, plus its email account.
// Anything that looks like a real account is kept.
export function classifyAbandonedPlaceholder(
  input: AbandonedPlaceholderInput
): AbandonedPlaceholderDecision {
  if (input.userEmail !== undefined || input.userPhone !== undefined)
    return 'keepHasIdentity';
  if (
    input.userEmailVerificationTime !== undefined ||
    input.userPhoneVerificationTime !== undefined
  )
    return 'keepVerified';
  if (input.hasProfile) return 'keepHasProfile';
  if (input.hasSession) return 'keepHasSession';
  if (input.hasOwnedRecords) return 'keepHasOwnedRecords';
  if (
    !Number.isFinite(input.userCreationTime) ||
    input.userCreationTime > input.now - ABANDONED_PLACEHOLDER_MIN_AGE_MS
  )
    return 'keepTooRecent';

  if (input.accounts.length === 0) {
    return isDetachedPlaceholderCleanupEligible({
      userEmail: input.userEmail,
      userEmailVerificationTime: input.userEmailVerificationTime,
      hasProfile: input.hasProfile,
      hasAuthAccount: false,
      hasSession: input.hasSession,
    })
      ? 'deleteDetachedPlaceholder'
      : 'keepAccountShape';
  }

  const [account] = input.accounts;
  if (
    input.accounts.length !== 1 ||
    account.provider !== 'email' ||
    account.emailVerified !== undefined ||
    account.phoneVerified !== undefined
  )
    return 'keepAccountShape';

  if (
    input.verificationCodeExpirations.length > ABANDONED_PLACEHOLDER_MAX_CODES
  )
    return 'keepPendingCode';
  for (const expirationTime of input.verificationCodeExpirations) {
    if (!Number.isFinite(expirationTime) || expirationTime > input.now)
      return 'keepPendingCode';
  }
  return 'deleteEmailCodePlaceholder';
}
