import { NextRequest, NextResponse } from 'next/server';
import {
  coarseDeviceCategory,
  normalizeUtmValue,
  safeReferrerHostname,
  trustedVercelCountry,
} from '@/lib/analytics/privacy';
import {
  grantTokenForUsername,
  PROFILE_GRANT_COOKIE,
  profileAccessService,
} from '@/lib/profile/passcode-server';
import {
  isSameOriginJsonPost,
  PRIVATE_NO_STORE_HEADERS,
  privateNoStoreNotFoundResponse,
  readBoundedJson,
} from '@/lib/profile/request-security';
import { resolveRequestHostBinding } from '@/lib/custom-domains/server-resolver';

export async function POST(request: NextRequest) {
  const binding = await resolveRequestHostBinding(request);
  if (binding.kind === 'denied') return privateNoStoreNotFoundResponse();
  if (!isSameOriginJsonPost(request)) {
    return new NextResponse(null, {
      status: 403,
      headers: PRIVATE_NO_STORE_HEADERS,
    });
  }
  try {
    const body: unknown = await readBoundedJson(request, 1024);
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new Error();
    const values = body as Record<string, unknown>;
    if (
      typeof values.username !== 'string' ||
      values.eventType !== 'view' ||
      !Object.keys(values).every((field) =>
        [
          'username',
          'eventType',
          'referrer',
          'utmSource',
          'utmMedium',
          'utmCampaign',
        ].includes(field)
      )
    ) {
      throw new Error();
    }
    if (binding.kind === 'custom' && values.username !== binding.username) {
      return privateNoStoreNotFoundResponse();
    }
    const token = grantTokenForUsername(
      request.cookies.get(PROFILE_GRANT_COOKIE)?.value,
      values.username
    );
    if (!token) throw new Error();
    const result = await profileAccessService('event', {
      username: values.username,
      token,
      eventType: 'view',
      referrer: safeReferrerHostname(values.referrer),
      countryCode: trustedVercelCountry(request.headers, process.env.VERCEL),
      deviceCategory: coarseDeviceCategory(request.headers.get('user-agent')),
      utmSource: normalizeUtmValue(values.utmSource),
      utmMedium: normalizeUtmValue(values.utmMedium),
      utmCampaign: normalizeUtmValue(values.utmCampaign),
    });
    if (!result.ok) throw new Error();
    return new NextResponse(null, {
      status: 204,
      headers: PRIVATE_NO_STORE_HEADERS,
    });
  } catch {
    return new NextResponse(null, {
      status: 400,
      headers: PRIVATE_NO_STORE_HEADERS,
    });
  }
}
