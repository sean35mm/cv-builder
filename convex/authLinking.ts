export const ACCOUNT_MATCH_ERROR =
  'We could not safely match this account. Please contact support.';

export type AuthLinkingCandidate<T extends string> = {
  userId: T;
  hasProfile: boolean;
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
  if (userId !== existingUserId && passwordUserId !== userId) {
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
