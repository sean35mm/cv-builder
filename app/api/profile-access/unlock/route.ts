import { NextRequest, NextResponse } from 'next/server';
import { trustedCallerAddress } from '@/lib/pdf/trusted-ip-header';
import {
  encodeGrantCookie,
  grantCookieOptions,
  pepperProfilePasscode,
  PROFILE_GRANT_COOKIE,
  profileAccessService,
  profileCallerHash,
} from '@/lib/profile/passcode-server';
import {
  isSameOriginJsonPost,
  PRIVATE_NO_STORE_HEADERS,
  privateNoStoreNotFoundResponse,
  readBoundedJson,
} from '@/lib/profile/request-security';
import { resolveRequestHostBinding } from '@/lib/custom-domains/server-resolver';

type UnlockResult = { token: string; username: string; expiresAt: number };

export async function POST(request: NextRequest) {
  const binding = await resolveRequestHostBinding(request);
  if (binding.kind === 'denied') return privateNoStoreNotFoundResponse();
  if (!isSameOriginJsonPost(request)) {
    return NextResponse.json(
      { error: 'Unable to unlock profile' },
      { status: 403, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }
  try {
    const body: unknown = await readBoundedJson(request, 1024);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    const { username, passcode } = body as {
      username?: unknown;
      passcode?: unknown;
    };
    if (typeof username !== 'string') throw new Error();
    if (binding.kind === 'custom' && username !== binding.username) {
      return privateNoStoreNotFoundResponse();
    }
    const address =
      trustedCallerAddress(request.headers, {
        vercel: process.env.VERCEL,
        cfPages: process.env.CF_PAGES,
        flyAppName: process.env.FLY_APP_NAME,
        trustedIpHeader: process.env.PDF_TRUSTED_IP_HEADER,
      }) ?? 'unavailable';
    const result = await profileAccessService<UnlockResult>('unlock', {
      username,
      digest: pepperProfilePasscode(passcode),
      callerHash: profileCallerHash(address),
    });
    if (!result.ok || !result.data) {
      return NextResponse.json(
        { error: 'Unable to unlock profile' },
        {
          status: result.status === 429 ? 429 : 401,
          headers: PRIVATE_NO_STORE_HEADERS,
        }
      );
    }
    const response = NextResponse.json(
      { ok: true },
      { headers: PRIVATE_NO_STORE_HEADERS }
    );
    response.cookies.set(
      PROFILE_GRANT_COOKIE,
      encodeGrantCookie(result.data.username, result.data.token),
      grantCookieOptions(result.data.expiresAt)
    );
    return response;
  } catch {
    return NextResponse.json(
      { error: 'Unable to unlock profile' },
      { status: 401, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }
}
