// ConvexError data kinds the email-code sender reports to the sign-in form.
// `RateLimited` comes from @convex-dev/rate-limiter and is raised before a
// new code replaces the previous one, so the previous code still works.
export const OTP_RATE_LIMITED = 'RateLimited';
// Raised after the new code was stored, so earlier codes no longer work.
export const OTP_DELIVERY_FAILED = 'OtpDeliveryFailed';

export type OtpSendFailure =
  | { kind: 'rateLimited'; retryAfterSeconds: number }
  | { kind: 'deliveryFailed' }
  | { kind: 'unknown' };

const errorData = (error: unknown): Record<string, unknown> | null => {
  if (typeof error !== 'object' || error === null) return null;
  if (
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null
  ) {
    return error.data as Record<string, unknown>;
  }
  // Convex Auth's Next.js proxy forwards only error.message. Its client throws
  // a plain Error, so accept the flat ConvexError JSON after the runtime prefix
  // as well as a direct JSON message. Never show the raw message to the user.
  if (
    !('message' in error) ||
    typeof error.message !== 'string' ||
    error.message.length > 16_384
  )
    return null;
  const message = error.message.trim();
  const encoded = message.startsWith('{')
    ? message
    : message.match(/Uncaught ConvexError:\s*(\{[^{}\r\n]*\})/)?.[1];
  if (!encoded) return null;
  try {
    const data: unknown = JSON.parse(encoded);
    return typeof data === 'object' && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

export function classifyOtpSendError(error: unknown): OtpSendFailure {
  const data = errorData(error);
  if (data?.kind === OTP_RATE_LIMITED) {
    const retryAfter = data.retryAfter;
    const retryAfterSeconds =
      typeof retryAfter === 'number' && Number.isFinite(retryAfter)
        ? Math.max(1, Math.ceil(retryAfter / 1000))
        : 60;
    return { kind: 'rateLimited', retryAfterSeconds };
  }
  if (data?.kind === OTP_DELIVERY_FAILED) return { kind: 'deliveryFailed' };
  return { kind: 'unknown' };
}

export function formatRetryWait(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function describeRetryWait(seconds: number): string {
  if (seconds < 60) return 'less than a minute';
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? 'about 1 minute' : `about ${minutes} minutes`;
}
