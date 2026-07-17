import { describe, expect, test } from 'bun:test';
import {
  createStorageAccessDto,
  evaluateUploadAbortPolicy,
  evaluateUploadReservationCompletion,
  isCompletedUploadRetry,
  isPreviewTokenEligible,
} from '../lib/profile/storage-policy';

const now = 1_000_000;
const validReservation = {
  sessionUserId: 'user-1',
  profileUserId: 'user-1',
  expectedContentType: 'image/png',
  expectedSize: 128,
  sessionCreatedAt: now - 1_000,
  sessionExpiresAt: now + 1_000,
  storageId: 'storage-1',
  storageCreationTime: now,
  storageContentType: 'image/png',
  storageSize: 128,
  sessionState: 'reserved',
  now,
  alreadyTracked: false,
};

describe('storage security policy', () => {
  test('finalizes only an owned, current, untracked upload with matching metadata', () => {
    expect(evaluateUploadReservationCompletion(validReservation)).toEqual({
      contentType: 'image/png',
      eligible: true,
      safelyMatchedUntracked: true,
    });
    expect(
      evaluateUploadReservationCompletion({
        ...validReservation,
        storageContentType: 'image/jpeg',
      })
    ).toMatchObject({ eligible: false, safelyMatchedUntracked: false });
    expect(
      evaluateUploadReservationCompletion({
        ...validReservation,
        profileUserId: 'user-2',
      })
    ).toMatchObject({ eligible: false, safelyMatchedUntracked: false });
    expect(
      evaluateUploadReservationCompletion({
        ...validReservation,
        alreadyTracked: true,
      })
    ).toMatchObject({ eligible: false, safelyMatchedUntracked: false });
    expect(
      evaluateUploadReservationCompletion({
        ...validReservation,
        expectedSize: 5 * 1024 * 1024 + 1,
        storageSize: 5 * 1024 * 1024 + 1,
      })
    ).toMatchObject({ eligible: false, safelyMatchedUntracked: false });
  });

  test('fails closed for legacy sessions without a declared content type', () => {
    expect(
      evaluateUploadReservationCompletion({
        ...validReservation,
        expectedContentType: undefined,
      })
    ).toMatchObject({ contentType: null, eligible: false });
  });

  test('makes completion retries idempotent and abort deletion conservative', () => {
    expect(
      isCompletedUploadRetry({
        sessionState: 'completed',
        recordedStorageId: 'storage-1',
        requestedStorageId: 'storage-1',
        sessionUserId: 'user-1',
        trackedUserId: 'user-1',
      })
    ).toBe(true);
    expect(
      evaluateUploadAbortPolicy({
        ...validReservation,
        sessionState: 'uploaded',
      }).shouldDelete
    ).toBe(true);
    expect(
      evaluateUploadAbortPolicy({
        ...validReservation,
        sessionState: 'completed',
      }).shouldDelete
    ).toBe(false);
    expect(
      evaluateUploadAbortPolicy({
        ...validReservation,
        alreadyTracked: true,
      }).shouldDelete
    ).toBe(false);
  });

  test('preview tokens authorize only uploads that are not associated', () => {
    const token = 'a'.repeat(48);
    expect(
      isPreviewTokenEligible({
        storedPreviewToken: token,
        suppliedPreviewToken: token,
      })
    ).toBe(true);
    expect(
      isPreviewTokenEligible({
        profileId: 'profile-1',
        storedPreviewToken: token,
        suppliedPreviewToken: token,
      })
    ).toBe(false);
  });

  test('public storage authorization DTO contains metadata but no provider URL', () => {
    const access = createStorageAccessDto({
      storageId: 'storage-1',
      contentType: 'image/png',
      size: 128,
      url: 'https://provider.invalid/raw',
    });
    expect(access).toEqual({
      storageId: 'storage-1',
      contentType: 'image/png',
      size: 128,
    });
    expect(access).not.toHaveProperty('url');
  });
});
