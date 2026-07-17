import 'server-only';

import { createHash } from 'node:crypto';
import { hmacProfilePasscode } from './passcode-hmac';
export {
  encodeGrantCookie,
  grantCookieOptions,
  grantTokenForUsername,
  parseGrantCookie,
} from './grant-cookie';

export const PROFILE_GRANT_TTL_SECONDS = 8 * 60 * 60;
export const PROFILE_GRANT_COOKIE =
  process.env.NODE_ENV === 'production'
    ? '__Host-profile_access'
    : 'profile_access';

const serviceConfiguration = (): { siteUrl: string; secret: string } => {
  const siteUrl = process.env.CONVEX_SITE_URL;
  const secret = process.env.PROFILE_ACCESS_SERVICE_SECRET;
  if (!siteUrl || !secret || secret.length < 32) {
    throw new Error('Profile access service is not configured');
  }
  const parsed = new URL(siteUrl);
  if (
    (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') ||
    (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
  ) {
    throw new Error('Profile access service URL is invalid');
  }
  return { siteUrl: parsed.origin, secret };
};

export const pepperProfilePasscode = (passcode: unknown): string => {
  const pepper = process.env.PROFILE_PASSCODE_PEPPER;
  if (!pepper || pepper.length < 32) {
    throw new Error('Profile passcode pepper is not configured');
  }
  return hmacProfilePasscode(passcode, pepper);
};

export const profileCallerHash = (address: string): string =>
  createHash('sha256').update(`profile-access-caller:${address}`).digest('hex');

export async function profileAccessService<T>(
  path: string,
  body: Record<string, unknown>,
  options?: { signal?: AbortSignal }
): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
  retryAfterSeconds: number | null;
}> {
  const { siteUrl, secret } = serviceConfiguration();
  const response = await fetch(`${siteUrl}/profile-access/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-profile-access-service-secret': secret,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: options?.signal,
  });
  let data: T | null = null;
  try {
    data = (await response.json()) as T;
  } catch {
    data = null;
  }
  const retryAfter = Number(response.headers.get('retry-after'));
  return {
    ok: response.ok,
    status: response.status,
    data,
    retryAfterSeconds:
      Number.isSafeInteger(retryAfter) && retryAfter > 0 ? retryAfter : null,
  };
}

export type ProfileAccessEnvelope = {
  profileId: string;
  username: string;
  mode: 'passcode' | 'unlisted' | 'public';
};

export type AuthorizedProfileBundle<
  TProfile = Record<string, unknown>,
  TTestimonial = Record<string, unknown>,
> = {
  profile: TProfile;
  testimonials: TTestimonial[];
  authorization: 'none' | 'grant' | 'owner';
};
