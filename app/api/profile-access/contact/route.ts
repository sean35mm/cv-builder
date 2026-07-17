import { NextRequest, NextResponse } from 'next/server';
import { fetchMutation } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
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
    return NextResponse.json(
      { error: 'Unable to send message' },
      { status: 403, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }
  try {
    const body: unknown = await readBoundedJson(request, 8 * 1024);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    const values = body as Record<string, unknown>;
    if (typeof values.username !== 'string') throw new Error();
    if (binding.kind === 'custom' && values.username !== binding.username) {
      return privateNoStoreNotFoundResponse();
    }
    const token = grantTokenForUsername(
      request.cookies.get(PROFILE_GRANT_COOKIE)?.value,
      values.username
    );
    const envelope =
      binding.kind === 'custom'
        ? await profileAccessService<{ mode: string }>('envelope', {
            username: binding.username,
          }).catch(() => null)
        : null;
    if (binding.kind === 'custom' && envelope?.data?.mode !== 'passcode') {
      await fetchMutation(api.messages.sendMessage, {
        profileId: binding.profileId as Id<'profiles'>,
        senderName: values.senderName as string,
        senderEmail: values.senderEmail as string,
        subject: values.subject as string,
        message: values.message as string,
      });
    } else {
      if (!token) throw new Error();
      const result = await profileAccessService('contact', { ...values, token });
      if (!result.ok) throw new Error();
    }
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Unable to send message' },
      { status: 400, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }
}
