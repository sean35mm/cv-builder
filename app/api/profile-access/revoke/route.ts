import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { profileAccessService } from '@/lib/profile/passcode-server';
import {
  isSameOriginJsonPost,
  PRIVATE_NO_STORE_HEADERS,
  readBoundedJson,
} from '@/lib/profile/request-security';

export async function POST(request: Request) {
  if (!isSameOriginJsonPost(request)) {
    return NextResponse.json(
      { error: 'Request failed' },
      { status: 403, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }
  try {
    const authToken = await convexAuthNextjsToken();
    if (!authToken) throw new Error();
    const profile = await fetchQuery(api.profiles.getMyProfile, {}, { token: authToken });
    if (!profile) throw new Error();
    const body: unknown = await readBoundedJson(request, 1024);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    const result = await profileAccessService('revoke', {
      profileId: profile._id,
    });
    if (!result.ok) throw new Error();
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Unable to revoke profile access' },
      { status: 400, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }
}
