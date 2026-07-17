import { v } from 'convex/values';
import { internalQuery } from './_generated/server';
import {
  createOperationalHealthSnapshot,
  OPERATIONAL_HEALTH_DEFAULT_SAMPLE_LIMIT,
  OPERATIONAL_HEALTH_MAX_SAMPLE_LIMIT,
} from './operationalHealthClassification';
import { analyticsRetentionCutoff } from '../lib/analytics/retention';

const boundedHealthSummaryValidator = v.object({
  sampledCount: v.number(),
  complete: v.boolean(),
  truncated: v.boolean(),
  oldestTimestamp: v.union(v.number(), v.null()),
});

export const snapshot = internalQuery({
  args: { sampleLimit: v.optional(v.number()) },
  returns: v.object({
    generatedAt: v.number(),
    sampleLimit: v.number(),
    deletionJobs: v.object({
      sampledCount: v.number(),
      complete: v.boolean(),
      truncated: v.boolean(),
      oldestTimestamp: v.union(v.number(), v.null()),
      staleSampledCount: v.number(),
      oldestActivityAt: v.union(v.number(), v.null()),
    }),
    expiredUploadReservations: v.object({
      sampledCount: v.number(),
      complete: v.boolean(),
      truncated: v.boolean(),
      oldestTimestamp: v.union(v.number(), v.null()),
      staleSampledCount: v.number(),
      stateCounts: v.object({
        reserved: v.number(),
        uploaded: v.number(),
        completed: v.number(),
        aborted: v.number(),
        legacyUnknown: v.number(),
      }),
    }),
    unassociatedTrackedUploads: boundedHealthSummaryValidator,
    expiredAnalytics: boundedHealthSummaryValidator,
    expiredAccessGrants: boundedHealthSummaryValidator,
    expiredPdfReceipts: boundedHealthSummaryValidator,
    expiredTestimonialTokens: boundedHealthSummaryValidator,
    customDomains: v.object({
      sampledCount: v.number(),
      complete: v.boolean(),
      truncated: v.boolean(),
      oldestTimestamp: v.union(v.number(), v.null()),
      statusCounts: v.object({
        pendingDns: v.number(),
        pendingProvider: v.number(),
        pendingVerification: v.number(),
        active: v.number(),
        misconfigured: v.number(),
        reconciling: v.number(),
        removing: v.number(),
        removeFailed: v.number(),
        removed: v.number(),
      }),
    }),
  }),
  handler: async (ctx, args) => {
    const sampleLimit =
      args.sampleLimit ?? OPERATIONAL_HEALTH_DEFAULT_SAMPLE_LIMIT;
    if (
      !Number.isInteger(sampleLimit) ||
      sampleLimit < 1 ||
      sampleLimit > OPERATIONAL_HEALTH_MAX_SAMPLE_LIMIT
    ) {
      throw new Error(
        `Operational health sample limit must be between 1 and ${OPERATIONAL_HEALTH_MAX_SAMPLE_LIMIT}`
      );
    }

    const generatedAt = Date.now();
    const [
      deletionJobs,
      expiredUploadSessions,
      unassociatedTrackedUploads,
      expiredAnalytics,
      expiredAccessGrants,
      expiredPdfReceipts,
      expiredTestimonialTokens,
      customDomains,
    ] = await Promise.all([
      ctx.db
        .query('deletionJobs')
        .withIndex('by_created_at')
        .order('asc')
        .take(sampleLimit + 1),
      ctx.db
        .query('uploadSessions')
        .withIndex('by_expiration', (q) => q.lt('expiresAt', generatedAt))
        .order('asc')
        .take(sampleLimit + 1),
      ctx.db
        .query('uploadedFiles')
        .withIndex('by_profile_and_created', (q) =>
          q.eq('profileId', undefined)
        )
        .order('asc')
        .take(sampleLimit + 1),
      ctx.db
        .query('profileAnalytics')
        .withIndex('by_created', (q) =>
          q.lt('createdAt', analyticsRetentionCutoff(generatedAt))
        )
        .order('asc')
        .take(sampleLimit + 1),
      ctx.db
        .query('profileAccessGrants')
        .withIndex('by_expiration', (q) => q.lt('expiresAt', generatedAt))
        .order('asc')
        .take(sampleLimit + 1),
      ctx.db
        .query('pdfDownloadReceipts')
        .withIndex('by_expiration', (q) => q.lt('expiresAt', generatedAt))
        .order('asc')
        .take(sampleLimit + 1),
      ctx.db
        .query('testimonials')
        .withIndex('by_expiration', (q) =>
          q.lt('tokenExpiresAt', generatedAt)
        )
        .order('asc')
        .take(sampleLimit + 1),
      ctx.db.query('customDomains').take(sampleLimit + 1),
    ]);

    return createOperationalHealthSnapshot({
      generatedAt,
      sampleLimit,
      deletionJobs,
      expiredUploadSessions,
      unassociatedTrackedUploads,
      expiredAnalytics,
      expiredAccessGrants,
      expiredPdfReceipts,
      expiredTestimonialTokens,
      customDomains,
    });
  },
});
