import {
  MAX_PROJECT_IMAGE_SIZE_BYTES,
  normalizeSafeRasterContentType,
  type SafeRasterContentType,
} from './raster-image-policy';

export const UPLOAD_SESSION_TTL_MS = 15 * 60 * 1000;
export const UPLOAD_CLOCK_TOLERANCE_MS = 5 * 1000;

type UploadReservationStorageInput = {
  sessionUserId: string;
  profileUserId?: string;
  expectedContentType?: string;
  expectedSize?: number;
  sessionCreatedAt?: number;
  sessionExpiresAt: number;
  recordedStorageId?: string;
  storageId: string;
  storageCreationTime: number;
  storageContentType?: string;
  storageSize: number;
  alreadyTracked: boolean;
};

export type UploadReservationCompletionPolicy = {
  contentType: SafeRasterContentType | null;
  eligible: boolean;
  safelyMatchedUntracked: boolean;
};

const evaluateReservationStorage = (input: UploadReservationStorageInput) => {
  const sessionCreatedAt =
    input.sessionCreatedAt ?? input.sessionExpiresAt - UPLOAD_SESSION_TTL_MS;
  const timestampsMatch =
    Number.isFinite(sessionCreatedAt) &&
    sessionCreatedAt <= input.sessionExpiresAt &&
    input.storageCreationTime >=
      sessionCreatedAt - UPLOAD_CLOCK_TOLERANCE_MS &&
    input.storageCreationTime <=
      input.sessionExpiresAt + UPLOAD_CLOCK_TOLERANCE_MS;
  const expectedContentType = normalizeSafeRasterContentType(
    input.expectedContentType
  );
  const storageContentType = normalizeSafeRasterContentType(
    input.storageContentType
  );
  const metadataMatches =
    expectedContentType !== null &&
    expectedContentType === storageContentType &&
    Number.isSafeInteger(input.expectedSize) &&
    input.expectedSize === input.storageSize &&
    input.storageSize > 0 &&
    input.storageSize <= MAX_PROJECT_IMAGE_SIZE_BYTES;
  const safelyMatchedUntracked =
    input.profileUserId === input.sessionUserId &&
    timestampsMatch &&
    (!input.recordedStorageId || input.recordedStorageId === input.storageId) &&
    metadataMatches &&
    !input.alreadyTracked;

  return { contentType: expectedContentType, safelyMatchedUntracked };
};

export const evaluateUploadReservationCompletion = (
  input: UploadReservationStorageInput & {
    sessionState?: string;
    now: number;
  }
): UploadReservationCompletionPolicy => {
  const storage = evaluateReservationStorage(input);

  return {
    contentType: storage.contentType,
    safelyMatchedUntracked: storage.safelyMatchedUntracked,
    eligible:
      storage.safelyMatchedUntracked &&
      (input.sessionState === undefined ||
        input.sessionState === 'reserved' ||
        input.sessionState === 'uploaded') &&
      input.sessionExpiresAt >= input.now &&
      Boolean(storage.contentType),
  };
};

export const evaluateUploadAbortPolicy = (
  input: UploadReservationStorageInput & { sessionState?: string }
): { shouldDelete: boolean } => ({
  shouldDelete:
    input.sessionState !== 'completed' &&
    evaluateReservationStorage(input).safelyMatchedUntracked,
});

export const isCompletedUploadRetry = ({
  sessionState,
  recordedStorageId,
  requestedStorageId,
  sessionUserId,
  trackedUserId,
}: {
  sessionState?: string;
  recordedStorageId?: string;
  requestedStorageId: string;
  sessionUserId: string;
  trackedUserId?: string;
}): boolean =>
  sessionState === 'completed' &&
  recordedStorageId === requestedStorageId &&
  trackedUserId === sessionUserId;

export const isPreviewTokenEligible = ({
  profileId,
  storedPreviewToken,
  suppliedPreviewToken,
}: {
  profileId?: string;
  storedPreviewToken?: string;
  suppliedPreviewToken?: string;
}): boolean =>
  !profileId &&
  typeof suppliedPreviewToken === 'string' &&
  /^[A-Za-z0-9_-]{48}$/.test(suppliedPreviewToken) &&
  storedPreviewToken === suppliedPreviewToken;

export const createStorageAccessDto = <TStorageId extends string>(upload: {
  storageId: TStorageId;
  contentType: string;
  size: number;
}) => ({
  storageId: upload.storageId,
  contentType: upload.contentType,
  size: upload.size,
});
