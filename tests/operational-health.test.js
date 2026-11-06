import { expect, test } from 'bun:test';
import {
  createOperationalHealthSnapshot,
  DELETION_JOB_STALE_AFTER_MS,
  summarizeSignupRecords,
} from '../convex/operationalHealthClassification';
import { signupActivity } from '../convex/operationalHealth';

test('signup counts distinguish unfinished records without returning identities', () => {
  const now = 10 * 86400000;
  const summary = summarizeSignupRecords(
    [
      { _creationTime: 0, hasProfile: false },
      { _creationTime: now, hasProfile: false },
      {
        _creationTime: 1,
        email: 'synthetic@example.invalid',
        emailVerificationTime: 0,
        hasProfile: true,
      },
      { _creationTime: 1, hasProfile: true },
    ],
    now
  );
  expect(summary).toEqual({
    userRecords: 4,
    recordsWithEmail: 1,
    verifiedEmailRecords: 1,
    profileOwners: 2,
    unfinishedEmailPlaceholders: 2,
    unfinishedOlderThan24Hours: 1,
  });
  expect(JSON.stringify(summary)).not.toContain('synthetic');
});

test('signup query returns bounded page counts and cursor, not a false complete total', async () => {
  const ctx = {
    db: {
      query(table) {
        if (table === 'users')
          return {
            paginate: async (opts) => {
              expect(opts.numItems).toBe(2);
              return {
                page: [
                  { _id: 'user-a', _creationTime: 1 },
                  {
                    _id: 'user-b',
                    _creationTime: 3,
                    email: 'synthetic@example.invalid',
                    emailVerificationTime: 3,
                  },
                ],
                isDone: false,
                continueCursor: 'next-page',
              };
            },
          };
        expect(table).toBe('profiles');
        return {
          withIndex(name, range) {
            expect(name).toBe('by_user');
            let user;
            range({
              eq: (field, value) => {
                expect(field).toBe('userId');
                user = value;
              },
            });
            return {
              first: async () =>
                user === 'user-b' ? { _id: 'private-profile' } : null,
            };
          },
        };
      },
    },
  };
  const result = await signupActivity._handler(ctx, {
    paginationOpts: { cursor: null, numItems: 2 },
    since: 2,
  });
  expect(result.isDone).toBe(false);
  expect(result.continueCursor).toBe('next-page');
  expect(result.pageCounts.userRecords).toBe(2);
  expect(result.pageCounts.unfinishedEmailPlaceholders).toBe(1);
  expect(result.createdSinceCounts.verifiedEmailRecords).toBe(1);
  expect(result.createdSinceCounts.profileOwners).toBe(1);
  for (const privateValue of [
    'user-a',
    'user-b',
    'private-profile',
    'synthetic@',
  ])
    expect(JSON.stringify(result)).not.toContain(privateValue);
  await expect(
    signupActivity._handler(
      {},
      { paginationOpts: { cursor: null, numItems: 101 }, since: 0 }
    )
  ).rejects.toThrow('page size');
});

test('operational health aggregates bounded samples without record identifiers', () => {
  const generatedAt = 2_000_000;
  const snapshot = createOperationalHealthSnapshot({
    generatedAt,
    sampleLimit: 2,
    deletionJobs: [
      {
        createdAt: 10,
        updatedAt: generatedAt - DELETION_JOB_STALE_AFTER_MS - 1,
      },
      { createdAt: 20, updatedAt: generatedAt },
      {
        createdAt: 5,
        updatedAt: generatedAt - DELETION_JOB_STALE_AFTER_MS - 1,
      },
    ],
    expiredUploadSessions: [
      { expiresAt: 100, state: 'reserved' },
      { expiresAt: 200, state: 'completed' },
      { expiresAt: 50, state: 'reserved' },
    ],
    unassociatedTrackedUploads: [
      { createdAt: 300 },
      { createdAt: 250 },
      { createdAt: 200 },
    ],
    expiredAnalytics: [
      { createdAt: 240 },
      { createdAt: 230 },
      { createdAt: 220 },
    ],
    expiredAccessGrants: [
      { expiresAt: 400 },
      { expiresAt: 350 },
      { expiresAt: 300 },
    ],
    expiredPdfReceipts: [
      { expiresAt: 600 },
      { expiresAt: 550 },
      { expiresAt: 500 },
    ],
    expiredTestimonialTokens: [
      { tokenExpiresAt: 500 },
      { tokenExpiresAt: 450 },
      { tokenExpiresAt: 400 },
    ],
    customDomains: [
      { createdAt: 700, status: 'active' },
      { createdAt: 650, status: 'remove_failed' },
      { createdAt: 600, status: 'pending_dns' },
    ],
  });

  expect(snapshot.deletionJobs).toEqual({
    sampledCount: 2,
    complete: false,
    truncated: true,
    oldestTimestamp: 10,
    staleSampledCount: 1,
    oldestActivityAt: generatedAt - DELETION_JOB_STALE_AFTER_MS - 1,
  });
  expect(snapshot.expiredUploadReservations.staleSampledCount).toBe(1);
  expect(snapshot.expiredUploadReservations.stateCounts).toEqual({
    reserved: 1,
    uploaded: 0,
    completed: 1,
    aborted: 0,
    legacyUnknown: 0,
  });
  expect(snapshot.unassociatedTrackedUploads).toEqual({
    sampledCount: 2,
    complete: false,
    truncated: true,
    oldestTimestamp: 250,
  });
  expect(snapshot.expiredAccessGrants.sampledCount).toBe(2);
  expect(snapshot.expiredAnalytics).toEqual({
    sampledCount: 2,
    complete: false,
    truncated: true,
    oldestTimestamp: 230,
  });
  expect(snapshot.expiredAccessGrants.oldestTimestamp).toBe(350);
  expect(JSON.stringify(snapshot)).not.toContain('storageId');
  expect(JSON.stringify(snapshot)).not.toContain('token');
  expect(snapshot.customDomains.statusCounts).toEqual({
    pendingDns: 0,
    pendingProvider: 0,
    pendingVerification: 0,
    active: 1,
    misconfigured: 0,
    reconciling: 0,
    removing: 0,
    removeFailed: 1,
    removed: 0,
  });
  expect(JSON.stringify(snapshot.customDomains)).not.toContain('hostname');
});

test('operational health marks exact-limit probes complete', () => {
  const snapshot = createOperationalHealthSnapshot({
    generatedAt: 2_000_000,
    sampleLimit: 2,
    deletionJobs: [{ createdAt: 10 }, { createdAt: 20 }],
    expiredUploadSessions: [
      { expiresAt: 100, state: 'reserved' },
      { expiresAt: 200, state: 'completed' },
    ],
    unassociatedTrackedUploads: [{ createdAt: 300 }, { createdAt: 400 }],
    expiredAnalytics: [{ createdAt: 450 }, { createdAt: 475 }],
    expiredAccessGrants: [{ expiresAt: 500 }, { expiresAt: 600 }],
    expiredPdfReceipts: [{ expiresAt: 700 }, { expiresAt: 800 }],
    expiredTestimonialTokens: [
      { tokenExpiresAt: 900 },
      { tokenExpiresAt: 1000 },
    ],
    customDomains: [
      { createdAt: 1100, status: 'active' },
      { createdAt: 1200, status: 'removed' },
    ],
  });

  for (const summary of [
    snapshot.deletionJobs,
    snapshot.expiredUploadReservations,
    snapshot.unassociatedTrackedUploads,
    snapshot.expiredAnalytics,
    snapshot.expiredAccessGrants,
    snapshot.expiredPdfReceipts,
    snapshot.expiredTestimonialTokens,
    snapshot.customDomains,
  ]) {
    expect(summary.sampledCount).toBe(2);
    expect(summary.complete).toBe(true);
    expect(summary.truncated).toBe(false);
  }
});
