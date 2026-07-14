export function isTestimonialRequestExpired(
  tokenExpiresAt: number | undefined,
  now: number
): boolean {
  return tokenExpiresAt === undefined || tokenExpiresAt <= now;
}

export function isTestimonialRequestActive(
  tokenExpiresAt: number | undefined,
  now: number
): tokenExpiresAt is number {
  return !isTestimonialRequestExpired(tokenExpiresAt, now);
}
