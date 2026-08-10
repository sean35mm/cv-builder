import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  coarseDeviceCategory,
  normalizeUtmValue,
  safeReferrerHostname,
  trustedVercelCountry,
} from '@/lib/analytics/privacy';
import { resolveRequestHostBinding } from '@/lib/custom-domains/server-resolver';
import { trustedCallerAddress } from '@/lib/pdf/trusted-ip-header';
import {
  grantTokenForUsername,
  PROFILE_GRANT_COOKIE,
  profileAccessService,
} from '@/lib/profile/passcode-server';
import {
  isSameOriginJsonPost,
  PRIVATE_NO_STORE_HEADERS,
  readBoundedJson,
} from '@/lib/profile/request-security';

function analyticsCallerHash(request: NextRequest): string | undefined {
  const address = trustedCallerAddress(request.headers, {
    vercel: process.env.VERCEL,
    cfPages: process.env.CF_PAGES,
    flyAppName: process.env.FLY_APP_NAME,
    trustedIpHeader: process.env.PDF_TRUSTED_IP_HEADER,
  });
  return address
    ? createHash('sha256').update(`analytics-caller:${address}`).digest('hex')
    : undefined;
}

export async function POST(request: NextRequest) {
  const binding = await resolveRequestHostBinding(request);
  if (binding.kind === 'denied' || !isSameOriginJsonPost(request)) {
    return new NextResponse(null, { status: 404, headers: PRIVATE_NO_STORE_HEADERS });
  }
  try {
    const body = await readBoundedJson<Record<string, unknown>>(request, 2_048);
    if (!body || typeof body !== 'object') throw new Error();
    const profileId = typeof body.profileId === 'string' ? body.profileId : '';
    const username = typeof body.username === 'string' ? body.username : '';
    if (
      !/^[A-Za-z0-9_-]{1,200}$/.test(profileId) ||
      !/^[A-Za-z0-9_-]{3,100}$/.test(username) ||
      (binding.kind === 'custom' &&
        (binding.profileId !== profileId || binding.username !== username))
    ) {
      throw new Error();
    }
    const event = {
      referrer: safeReferrerHostname(body.referrer),
      countryCode: trustedVercelCountry(request.headers, process.env.VERCEL),
      deviceCategory: coarseDeviceCategory(request.headers.get('user-agent')),
      utmSource: normalizeUtmValue(body.utmSource),
      utmMedium: normalizeUtmValue(body.utmMedium),
      utmCampaign: normalizeUtmValue(body.utmCampaign),
    };
    if (body.protectedProfile === true) {
      const token = grantTokenForUsername(
        request.cookies.get(PROFILE_GRANT_COOKIE)?.value,
        username
      );
      if (!token) throw new Error();
      const result = await profileAccessService('event', {
        username,
        token,
        eventType: 'view',
        ...event,
      });
      if (!result.ok) throw new Error();
    } else {
      const result = await profileAccessService('analytics-event', {
        profileId,
        username,
        callerHash: analyticsCallerHash(request),
        ...event,
      });
      if (!result.ok) throw new Error();
    }
    return new NextResponse(null, { status: 204, headers: PRIVATE_NO_STORE_HEADERS });
  } catch {
    return new NextResponse(null, { status: 400, headers: PRIVATE_NO_STORE_HEADERS });
  }
}
