import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { notFound } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';

const PREVIEW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{48}$/;
const PROFILE_USERNAME_PATTERN =
  /^(?:[a-z0-9_]{3,15}|[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?)$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storageId: string }> }
) {
  const { storageId } = await params;
  if (
    !storageId ||
    storageId.length > 200 ||
    !/^[A-Za-z0-9_-]+$/.test(storageId)
  ) {
    return notFound();
  }

  const searchParams = new URL(request.url).searchParams;
  const previewTokens = searchParams.getAll('token');
  if (
    previewTokens.length > 1 ||
    (previewTokens[0] !== undefined &&
      !PREVIEW_TOKEN_PATTERN.test(previewTokens[0]))
  ) {
    return notFound();
  }

  const profiles = searchParams.getAll('profile');
  if (
    profiles.length > 1 ||
    (profiles[0] !== undefined && !PROFILE_USERNAME_PATTERN.test(profiles[0]))
  ) {
    return notFound();
  }

  const authToken = await convexAuthNextjsToken();
  const url = await fetchQuery(
    api.storage.getImageUrl,
    {
      storageId: storageId as Id<'_storage'>,
      previewToken: previewTokens[0],
      profileUsername: profiles[0],
    },
    authToken ? { token: authToken } : {}
  );

  if (!url) {
    return notFound();
  }

  return Response.redirect(url);
}
