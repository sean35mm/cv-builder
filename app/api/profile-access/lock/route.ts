import { NextResponse } from 'next/server';
import { PROFILE_GRANT_COOKIE } from '@/lib/profile/passcode-server';
import {
  isSameOriginJsonPost,
  PRIVATE_NO_STORE_HEADERS,
  privateNoStoreNotFoundResponse,
} from '@/lib/profile/request-security';
import { resolveRequestHostBinding } from '@/lib/custom-domains/server-resolver';

export async function POST(request: Request) {
  if ((await resolveRequestHostBinding(request)).kind === 'denied') {
    return privateNoStoreNotFoundResponse();
  }
  if (!isSameOriginJsonPost(request)) {
    return NextResponse.json(
      { error: 'Request failed' },
      { status: 403, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }
  const response = NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  response.cookies.set(PROFILE_GRANT_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
