import { fetchQuery } from 'convex/nextjs';
import type { NextRequest } from 'next/server';
import { toBuffer, toString } from 'qrcode';

import { api } from '@/convex/_generated/api';
import { profileCanonicalUrl } from '@/lib/custom-domains/access-metadata';
import { resolveRequestHostBinding } from '@/lib/custom-domains/server-resolver';
import { getSiteOrigin } from '@/lib/custom-domains/server-config';
import {
  profileAccessService,
  type ProfileAccessEnvelope,
} from '@/lib/profile/passcode-server';
import { PRIVATE_NO_STORE_HEADERS } from '@/lib/profile/request-security';
import {
  canGenerateProfileQr,
  safeShareFileName,
} from '@/lib/profile/share-assets';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username') ?? '';
  const format = request.nextUrl.searchParams.get('format') === 'png' ? 'png' : 'svg';
  const download = request.nextUrl.searchParams.get('download') === '1';
  const requestedSize = Number(request.nextUrl.searchParams.get('size') ?? 512);
  const size = Number.isInteger(requestedSize)
    ? Math.min(1024, Math.max(128, requestedSize))
    : 512;
  const hostBinding = await resolveRequestHostBinding(request);
  if (
    hostBinding.kind === 'denied' ||
    !username ||
    username.length > 100 ||
    /[/?#%\\]/.test(username) ||
    (hostBinding.kind === 'custom' && hostBinding.username !== username)
  ) {
    return new Response(null, { status: 404, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const profile = await fetchQuery(api.profiles.getProfileByUsername, {
    username,
  }).catch(() => null);
  let canonicalUsername =
    profile && canGenerateProfileQr(profile.accessMode)
      ? profile.username
      : undefined;
  if (!canonicalUsername) {
    const envelope = await profileAccessService<ProfileAccessEnvelope>('envelope', {
      username,
    }).catch(() => null);
    if (
      !envelope?.ok ||
      !envelope.data ||
      !canGenerateProfileQr(envelope.data.mode) ||
      envelope.data.mode !== 'passcode'
    ) {
      return new Response(null, { status: 404, headers: PRIVATE_NO_STORE_HEADERS });
    }
    canonicalUsername = envelope.data.username;
  }
  const activeDomain = await fetchQuery(
    api.customDomains.resolveActiveForUsername,
    { username: canonicalUsername }
  ).catch(() => null);
  const canonicalUrl = profileCanonicalUrl(
    getSiteOrigin(),
    canonicalUsername,
    activeDomain?.hostname
  );
  const headers = {
    ...PRIVATE_NO_STORE_HEADERS,
    'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${safeShareFileName(canonicalUsername, format)}"`,
  };
  try {
    if (format === 'png') {
      const png = await toBuffer(canonicalUrl, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: size,
        type: 'png',
      });
      return new Response(Buffer.from(png), {
        headers: { ...headers, 'Content-Type': 'image/png' },
      });
    }
    const svg = await toString(canonicalUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: size,
      type: 'svg',
    });
    if (svg.length > 1_000_000) throw new Error('QR output is too large');
    return new Response(svg, {
      headers: { ...headers, 'Content-Type': 'image/svg+xml; charset=utf-8' },
    });
  } catch {
    return new Response(null, { status: 500, headers: PRIVATE_NO_STORE_HEADERS });
  }
}
