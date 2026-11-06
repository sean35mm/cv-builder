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
