import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { isProfileAccessMode } from '@/lib/profile/access';
import {
  pepperProfilePasscode,
  profileAccessService,
} from '@/lib/profile/passcode-server';
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
    const { mode, passcode } = body as { mode?: unknown; passcode?: unknown };
    if (!isProfileAccessMode(mode)) throw new Error();
    const result = await profileAccessService('configure', {
      profileId: profile._id,
      mode,
      ...(mode === 'passcode'
        ? { digest: pepperProfilePasscode(passcode) }
        : {}),
    });
    if (result.status === 429) {
      return NextResponse.json(
        { error: 'Unable to update profile access' },
        {
          status: 429,
          headers: {
            ...PRIVATE_NO_STORE_HEADERS,
            'Retry-After': String(result.retryAfterSeconds ?? 60),
          },
        }
      );
    }
    if (!result.ok) throw new Error();
    return NextResponse.json(
      { ok: true, mode },
      { headers: PRIVATE_NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { error: 'Unable to update profile access' },
      { status: 400, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }
}
