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
