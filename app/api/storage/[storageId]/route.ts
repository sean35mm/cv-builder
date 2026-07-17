import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { NextRequest } from 'next/server';
import {
  grantTokenForUsername,
  PROFILE_GRANT_COOKIE,
  profileAccessService,
  type ProfileAccessEnvelope,
} from '@/lib/profile/passcode-server';
import {
  MAX_PROJECT_IMAGE_SIZE_BYTES,
  normalizeSafeRasterContentType,
  rasterProxyHeaders,
  RASTER_FAILURE_HEADERS,
  validateRasterContent,
} from '@/lib/profile/raster-image-policy';
import { resolveRequestHostBinding } from '@/lib/custom-domains/server-resolver';
import { privateNoStoreNotFoundResponse } from '@/lib/profile/request-security';

const PREVIEW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{48}$/;
const PROFILE_USERNAME_PATTERN =
  /^(?:[a-z0-9_]{3,15}|[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?)$/;
type StorageAccess = { storageId: string; contentType: string; size: number };
type StorageResolution = { url: string; contentType: string; size: number };

const managedNotFound = () =>
  new Response(null, { status: 404, headers: RASTER_FAILURE_HEADERS });

const readBoundedBody = async (
  response: Response,
  expectedSize: number
): Promise<Uint8Array | null> => {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > expectedSize || total > MAX_PROJECT_IMAGE_SIZE_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  if (total !== expectedSize) return null;
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
};

const proxyManagedImage = async (
  access: StorageResolution
): Promise<Response> => {
  const declaredType = normalizeSafeRasterContentType(access.contentType);
  if (
    !declaredType ||
    !Number.isSafeInteger(access.size) ||
    access.size <= 0 ||
    access.size > MAX_PROJECT_IMAGE_SIZE_BYTES
  ) {
    return managedNotFound();
  }
  const upstream = await fetch(access.url, {
    cache: 'no-store',
    redirect: 'error',
  }).catch(() => null);
  if (!upstream?.ok) return managedNotFound();
  const upstreamType = normalizeSafeRasterContentType(
    upstream.headers.get('content-type')
  );
  const upstreamLength = upstream.headers.get('content-length');
  if (
    upstreamType !== declaredType ||
    (upstreamLength !== null && Number(upstreamLength) !== access.size)
  ) {
    return managedNotFound();
  }
  const bytes = await readBoundedBody(upstream, access.size);
  const verifiedType = bytes
    ? validateRasterContent(declaredType, bytes)
    : null;
  if (!bytes || !verifiedType) return managedNotFound();
  return new Response(bytes, {
    status: 200,
    headers: rasterProxyHeaders(verifiedType, bytes.byteLength),
  });
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storageId: string }> }
) {
  const { storageId } = await params;
  const hostBinding = await resolveRequestHostBinding(request);
  if (hostBinding.kind === 'denied') return privateNoStoreNotFoundResponse();
  if (
    !storageId ||
    storageId.length > 200 ||
    !/^[A-Za-z0-9_-]+$/.test(storageId)
  ) {
    return managedNotFound();
  }

  const searchParams = new URL(request.url).searchParams;
  const queryKeys = [...searchParams.keys()];
  if (
    queryKeys.some((key) => key !== 'token' && key !== 'profile') ||
    new Set(queryKeys).size > 1
  ) {
    return managedNotFound();
  }
  const previewTokens = searchParams.getAll('token');
  if (
    previewTokens.length > 1 ||
    (previewTokens[0] !== undefined &&
      !PREVIEW_TOKEN_PATTERN.test(previewTokens[0])) ||
    (hostBinding.kind === 'custom' && previewTokens[0] !== undefined)
  ) {
    return managedNotFound();
  }

  const profiles = searchParams.getAll('profile');
  if (
    profiles.length > 1 ||
    (profiles[0] !== undefined && !PROFILE_USERNAME_PATTERN.test(profiles[0]))
  ) {
    return managedNotFound();
  }
  if (
    hostBinding.kind === 'custom' &&
    profiles[0] !== undefined &&
    profiles[0] !== hostBinding.username
  ) {
    return privateNoStoreNotFoundResponse();
  }
  const profileUsername =
    hostBinding.kind === 'custom' ? hostBinding.username : profiles[0];

  const authToken =
    hostBinding.kind === 'custom' ? undefined : await convexAuthNextjsToken();
  const ownerProfile = authToken
    ? await fetchQuery(api.profiles.getMyProfile, {}, { token: authToken }).catch(
        () => null
      )
    : null;
  let access: StorageAccess | null = null;
  let resolutionRequest: Record<string, unknown> | null = null;
  if (profileUsername) {
    const envelopeResponse = await profileAccessService<ProfileAccessEnvelope>(
      'envelope',
      { username: profileUsername }
    ).catch(() => null);
    const envelope = envelopeResponse?.ok ? envelopeResponse.data : null;
    if (envelope?.mode === 'passcode') {
      const token = grantTokenForUsername(
        request.cookies.get(PROFILE_GRANT_COOKIE)?.value,
        envelope.username
      );
      const protectedResult = await profileAccessService<StorageAccess>('storage', {
        username: envelope.username,
        storageId,
        ...(token ? { token } : {}),
        ...(ownerProfile?._id === envelope.profileId
          ? { ownerProfileId: ownerProfile._id }
          : {}),
      }).catch(() => null);
      if (!protectedResult?.ok || !protectedResult.data) {
        return managedNotFound();
      }
      access = protectedResult.data;
      resolutionRequest = {
        authorization: 'protected',
        username: envelope.username,
        storageId,
        ...(token ? { token } : {}),
        ...(ownerProfile?._id === envelope.profileId
          ? { ownerProfileId: ownerProfile._id }
          : {}),
      };
    }
  }

  if (!access) {
    access = await fetchQuery(
      api.storage.getImageAccess,
      {
        storageId: storageId as Id<'_storage'>,
        previewToken: previewTokens[0],
        profileUsername,
      },
      authToken ? { token: authToken } : {}
    );
    if (access) {
      resolutionRequest = {
        authorization: 'standard',
        storageId,
        previewToken: previewTokens[0],
        profileUsername,
        ownerProfileId: ownerProfile?._id,
      };
    }
  }
  if (!access || access.storageId !== storageId || !resolutionRequest) {
    return managedNotFound();
  }
  const resolution = await profileAccessService<StorageResolution>(
    'storage-resolve',
    resolutionRequest
  ).catch(() => null);
  if (
    !resolution?.ok ||
    !resolution.data ||
    resolution.data.contentType !== access.contentType ||
    resolution.data.size !== access.size
  ) {
    return managedNotFound();
  }
  return await proxyManagedImage(resolution.data);
}
