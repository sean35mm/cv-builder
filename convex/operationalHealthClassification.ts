export const OPERATIONAL_HEALTH_DEFAULT_SAMPLE_LIMIT = 50;
export const OPERATIONAL_HEALTH_MAX_SAMPLE_LIMIT = 100;
export const DELETION_JOB_STALE_AFTER_MS = 15 * 60 * 1000;

type BoundedHealthSummary = {
  sampledCount: number;
  complete: boolean;
  truncated: boolean;
  oldestTimestamp: number | null;
};

const summarizeBoundedSample = <T>(
  rows: T[],
  sampleLimit: number,
  timestamp: (row: T) => number
): BoundedHealthSummary => {
  const sampledRows = rows.slice(0, sampleLimit);
  return {
    sampledCount: sampledRows.length,
    complete: rows.length <= sampleLimit,
    truncated: rows.length > sampleLimit,
    oldestTimestamp:
      sampledRows.length === 0
        ? null
        : sampledRows.reduce(
            (oldest, row) => Math.min(oldest, timestamp(row)),
            Number.POSITIVE_INFINITY
          ),
  };
};

const boundedRows = <T>(rows: T[], sampleLimit: number): T[] =>
  rows.slice(0, sampleLimit);

export type OperationalHealthInput = {
  generatedAt: number;
  sampleLimit: number;
  deletionJobs: Array<{
    createdAt: number;
    updatedAt?: number;
    lastAttemptAt?: number;
  }>;
  expiredUploadSessions: Array<{
    expiresAt: number;
    state?: 'reserved' | 'uploaded' | 'completed' | 'aborted';
  }>;
  unassociatedTrackedUploads: Array<{ createdAt: number }>;
  expiredAnalytics: Array<{ createdAt: number }>;
  expiredAccessGrants: Array<{ expiresAt: number }>;
  expiredPdfReceipts: Array<{ expiresAt: number }>;
  expiredTestimonialTokens: Array<{ tokenExpiresAt?: number }>;
  customDomains?: Array<{
    createdAt: number;
    status:
      | 'pending_dns'
      | 'pending_provider'
      | 'pending_verification'
      | 'active'
      | 'misconfigured'
      | 'reconciling'
      | 'removing'
      | 'remove_failed'
      | 'removed';
  }>;
};

export function createOperationalHealthSnapshot(input: OperationalHealthInput) {
  const deletionJobs = summarizeBoundedSample(
    input.deletionJobs,
    input.sampleLimit,
    (job) => job.createdAt
  );
  const sampledDeletionJobs = boundedRows(
    input.deletionJobs,
    input.sampleLimit
  );
  let staleDeletionJobsSampled = 0;
  let oldestDeletionJobActivityAt: number | null = null;
  for (const job of sampledDeletionJobs) {
    const activityAt = Math.max(
      job.updatedAt ?? job.createdAt,
      job.lastAttemptAt ?? 0
    );
    oldestDeletionJobActivityAt =
      oldestDeletionJobActivityAt === null
        ? activityAt
        : Math.min(oldestDeletionJobActivityAt, activityAt);
    if (activityAt <= input.generatedAt - DELETION_JOB_STALE_AFTER_MS) {
      staleDeletionJobsSampled += 1;
    }
  }

  const expiredUploadReservations = summarizeBoundedSample(
    input.expiredUploadSessions,
    input.sampleLimit,
    (session) => session.expiresAt
  );
  const sampledExpiredUploadSessions = boundedRows(
    input.expiredUploadSessions,
    input.sampleLimit
  );
  const uploadSessionStates = {
    reserved: 0,
    uploaded: 0,
    completed: 0,
    aborted: 0,
    legacyUnknown: 0,
  };
  for (const session of sampledExpiredUploadSessions) {
    if (session.state === undefined) uploadSessionStates.legacyUnknown += 1;
    else uploadSessionStates[session.state] += 1;
  }
  const customDomainRows = input.customDomains ?? [];
  const customDomainStates = {
    pendingDns: 0,
    pendingProvider: 0,
    pendingVerification: 0,
    active: 0,
    misconfigured: 0,
    reconciling: 0,
    removing: 0,
    removeFailed: 0,
    removed: 0,
  };
  for (const domain of boundedRows(customDomainRows, input.sampleLimit)) {
    const key = domain.status.replace(/_([a-z])/g, (_, letter: string) =>
      letter.toUpperCase()
    ) as keyof typeof customDomainStates;
    customDomainStates[key] += 1;
  }

  return {
    generatedAt: input.generatedAt,
    sampleLimit: input.sampleLimit,
    deletionJobs: {
      ...deletionJobs,
      staleSampledCount: staleDeletionJobsSampled,
      oldestActivityAt: oldestDeletionJobActivityAt,
    },
    expiredUploadReservations: {
      ...expiredUploadReservations,
      staleSampledCount:
        uploadSessionStates.reserved +
        uploadSessionStates.uploaded +
        uploadSessionStates.legacyUnknown,
      stateCounts: uploadSessionStates,
    },
    unassociatedTrackedUploads: summarizeBoundedSample(
      input.unassociatedTrackedUploads,
      input.sampleLimit,
      (upload) => upload.createdAt
    ),
    expiredAnalytics: summarizeBoundedSample(
      input.expiredAnalytics,
      input.sampleLimit,
      (event) => event.createdAt
    ),
    expiredAccessGrants: summarizeBoundedSample(
      input.expiredAccessGrants,
      input.sampleLimit,
      (grant) => grant.expiresAt
    ),
    expiredPdfReceipts: summarizeBoundedSample(
      input.expiredPdfReceipts,
      input.sampleLimit,
      (receipt) => receipt.expiresAt
    ),
    expiredTestimonialTokens: summarizeBoundedSample(
      input.expiredTestimonialTokens,
      input.sampleLimit,
      (testimonial) => testimonial.tokenExpiresAt ?? input.generatedAt
    ),
    customDomains: {
      ...summarizeBoundedSample(
        customDomainRows,
        input.sampleLimit,
        (domain) => domain.createdAt
      ),
      statusCounts: customDomainStates,
    },
  };
}
