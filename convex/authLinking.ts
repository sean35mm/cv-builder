export const ACCOUNT_MATCH_ERROR =
  'We could not safely match this account. Please contact support.';

export const OAUTH_UNVERIFIED_EMAIL_ERROR =
  "This sign-in provider hasn't verified your email. Continue with email instead.";

export type AuthLinkingCandidate<T extends string> = {
  userId: T;
  hasProfile: boolean;
  // The user row's email was verified (email code or a verified OAuth email).
  emailVerified?: boolean;
};

type PlaceholderAccount<T extends string> = {
  userId: T;
  emailVerified?: unknown;
};

export type AuthLinkingDecision<T extends string> = {
  userId: T;
  cleanupCandidateId: T | null;
};

export function selectAuthLinkingDecision<T extends string>(
  candidates: AuthLinkingCandidate<T>[],
  existingUserId: T,
  passwordUserId: T | undefined,
  placeholderAccount?: PlaceholderAccount<T>
): AuthLinkingDecision<T> {
  const existingCandidate = candidates.find(
    (candidate) => candidate.userId === existingUserId
  );
  const otherProfileOwners = candidates.filter(
    (candidate) =>
      candidate.userId !== existingUserId && candidate.hasProfile
  );

  if (
    (existingCandidate?.hasProfile && otherProfileOwners.length > 0) ||
    otherProfileOwners.length > 1
  ) {
    throw new Error(ACCOUNT_MATCH_ERROR);
  }

  const profileOwnerId = existingCandidate?.hasProfile
    ? existingUserId
    : otherProfileOwners[0]?.userId;
  const userId = profileOwnerId ?? existingUserId;
  if (
    userId !== existingUserId &&
    passwordUserId !== userId &&
    !otherProfileOwners[0]?.emailVerified
  ) {
    throw new Error(ACCOUNT_MATCH_ERROR);
  }

  const cleanupCandidateId =
    userId !== existingUserId &&
    placeholderAccount?.userId === existingUserId &&
    !placeholderAccount.emailVerified
      ? existingUserId
      : null;

  return { userId, cleanupCandidateId };
}

export type OAuthLinkingCandidate<T extends string> = {
  userId: T;
  email?: string;
  hasProfile: boolean;
  emailVerified: boolean;
};

// Returns the user a new OAuth account should attach to, or null to create a
// new user. Only users whose own email matches are considered, so email-less
// placeholders from unfinished email-code sign-ins never match.
export function selectOAuthLinkingDecision<T extends string>(
  email: string | undefined,
  emailVerified: unknown,
  candidates: OAuthLinkingCandidate<T>[]
): T | null {
  if (emailVerified !== true || !email) {
    throw new Error(OAUTH_UNVERIFIED_EMAIL_ERROR);
  }
  const matches = candidates.filter(
    (candidate, index) =>
      candidate.email?.trim().toLowerCase() === email &&
      candidates.findIndex((other) => other.userId === candidate.userId) ===
        index
  );
  if (matches.length === 0) return null;
  // A dormant, never-verified password account without a profile could be a
  // squatter's, so it isn't linked either.
  if (
    matches.length > 1 ||
    (!matches[0].hasProfile && !matches[0].emailVerified)
  ) {
    throw new Error(ACCOUNT_MATCH_ERROR);
  }
  return matches[0].userId;
}
