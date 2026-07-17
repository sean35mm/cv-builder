import { expect, test } from 'bun:test';
import {
  createOperationalHealthSnapshot,
  DELETION_JOB_STALE_AFTER_MS,
} from '../convex/operationalHealthClassification';

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
