import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { NextResponse } from 'next/server';

import { api } from '@/convex/_generated/api';
import { profileAccessService } from '@/lib/profile/passcode-server';
import { validateRasterContent } from '@/lib/profile/raster-image-policy';
import {
  isSameOriginMultipartPost,
  parseDeclaredMultipartImage,
  PRIVATE_NO_STORE_HEADERS,
} from '@/lib/profile/request-security';

type UploadReservation = { uploadUrl: string; uploadToken: string };
type UploadCompletion = { status: 'success'; previewToken: string };

const uploadFailure = (status = 400, retryAfterSeconds?: number | null) =>
  NextResponse.json(
    { error: 'Could not upload image' },
    {
      status,
      headers: {
        ...PRIVATE_NO_STORE_HEADERS,
        ...(status === 429
          ? { 'Retry-After': String(retryAfterSeconds ?? 60) }
          : {}),
      },
    }
  );

const providerStorageId = (value: unknown): string | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const storageId = (value as { storageId?: unknown }).storageId;
  return typeof storageId === 'string' &&
    storageId.length <= 200 &&
    /^[A-Za-z0-9_-]+$/.test(storageId)
    ? storageId
    : null;
};

const completeUpload = async (uploadToken: string, storageId: string) => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await profileAccessService<UploadCompletion>('upload-complete', {
        uploadToken,
        storageId,
      });
    } catch {
      if (attempt === 1) throw new Error('Upload completion failed');
    }
  }
  throw new Error('Upload completion failed');
};

export async function POST(request: Request) {
  if (!isSameOriginMultipartPost(request)) return uploadFailure(403);

  let uploadToken: string | undefined;
  let storageId: string | undefined;
  let completed = false;
  try {
    const authToken = await convexAuthNextjsToken();
    if (!authToken) return uploadFailure(401);
    const profile = await fetchQuery(
      api.profiles.getMyProfile,
      {},
      { token: authToken }
    );
    if (!profile) return uploadFailure(401);

    const declaredImage = parseDeclaredMultipartImage(request);
    if (!declaredImage) return uploadFailure();
    const reservation = await profileAccessService<UploadReservation>(
      'upload-reserve',
      {
        profileId: profile._id,
        expectedContentType: declaredImage.contentType,
        expectedSize: declaredImage.size,
      }
    );
    if (reservation.data?.uploadToken) {
      uploadToken = reservation.data.uploadToken;
    }
    if (reservation.status === 429) {
      return uploadFailure(429, reservation.retryAfterSeconds);
    }
    if (
      !reservation.ok ||
      !reservation.data ||
      !/^[A-Za-z0-9_-]{48}$/.test(reservation.data.uploadToken) ||
      typeof reservation.data.uploadUrl !== 'string' ||
      !reservation.data.uploadUrl
    ) {
      return uploadFailure();
    }
    const reservedUploadToken = reservation.data.uploadToken;

    const formData = await request.formData();
    const entries = [...formData.entries()];
    if (
      entries.length !== 1 ||
      entries[0][0] !== 'file' ||
      !(entries[0][1] instanceof File)
    ) {
      return uploadFailure();
    }
    const file = entries[0][1];
    if (
      file.type !== declaredImage.contentType ||
      file.size !== declaredImage.size
    ) {
      return uploadFailure();
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (
      bytes.byteLength !== declaredImage.size ||
      validateRasterContent(declaredImage.contentType, bytes) !==
        declaredImage.contentType
    ) {
      return uploadFailure();
    }

    const providerResponse = await fetch(reservation.data.uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': declaredImage.contentType },
      body: new Blob([bytes], { type: declaredImage.contentType }),
      cache: 'no-store',
      redirect: 'error',
    });
    if (!providerResponse.ok || providerResponse.redirected) {
      throw new Error('Provider upload failed');
    }
    const uploadedStorageId = providerStorageId(await providerResponse.json());
    if (!uploadedStorageId) throw new Error('Provider upload failed');
    storageId = uploadedStorageId;

    const completion = await completeUpload(reservedUploadToken, storageId);
    if (
      !completion.ok ||
      completion.data?.status !== 'success' ||
      !/^[A-Za-z0-9_-]{48}$/.test(completion.data.previewToken)
    ) {
      throw new Error('Upload completion failed');
    }
    completed = true;
    return NextResponse.json(
      {
        url: `/api/storage/${storageId}?token=${encodeURIComponent(
          completion.data.previewToken
        )}`,
      },
      { headers: PRIVATE_NO_STORE_HEADERS }
    );
  } catch {
    return uploadFailure();
  } finally {
    if (uploadToken && !completed) {
      await profileAccessService(
        'upload-abort',
        { uploadToken, ...(storageId ? { storageId } : {}) },
        { signal: AbortSignal.timeout(3_000) }
      ).catch(() => undefined);
    }
  }
}
