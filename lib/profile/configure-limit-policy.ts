export const PROFILE_CONFIGURE_LIMITS = {
  global: { rate: 30, periodMs: 60 * 1000 },
  perUserProfile: { rate: 5, periodMs: 60 * 60 * 1000 },
} as const;

export const profileConfigureLimitIdentity = (
  userId: string,
  profileId: string
): string => {
  if (
    !userId ||
    !profileId ||
    userId.length > 200 ||
    profileId.length > 200
  ) {
    throw new Error('Configure rate limit identity is invalid');
  }
  return `${userId}:${profileId}`;
};

const MAX_RETRY_AFTER_SECONDS = 60 * 60;

export const retryAfterSeconds = (milliseconds: number): number => {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return 1;
  return Math.min(
    MAX_RETRY_AFTER_SECONDS,
    Math.max(1, Math.ceil(milliseconds / 1000))
  );
};

export const rateLimitResponse = (retryAfterMilliseconds: number) => ({
  status: 429 as const,
  headers: {
    'Retry-After': String(retryAfterSeconds(retryAfterMilliseconds)),
  },
});
