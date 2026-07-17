import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import {
  internalMutation,
  mutation,
  type MutationCtx,
} from './_generated/server';
import { normalizeEmail } from './validation';
import { removeDirectoryProjectionForProfile } from './directory';
import { enumerateProfileManagedMedia } from '../lib/profile/media';
import { evaluateUploadAbortPolicy } from '../lib/profile/storage-policy';
import { accountDeletionCustomDomainPolicy } from '../lib/custom-domains/lifecycle';

const DELETE_BATCH_SIZE = 50;
const INITIAL_CLEANUP_DELAY_MS = 5_000;
const MAX_RESUME_JOBS = 25;
const STALE_DELETION_JOB_MS = 15 * 60 * 1000;

type DeletionStage = Doc<'deletionJobs'>['stage'];

const nextStage: Record<DeletionStage, DeletionStage | null> = {
  customDomain: 'pdfReceipts',
  pdfReceipts: 'accessGrants',
  accessGrants: 'passcodes',
  passcodes: 'analytics',
  analytics: 'messages',
  messages: 'versions',
  versions: 'testimonials',
  testimonials: 'trackedFiles',
  trackedFiles: 'legacyFiles',
  legacyFiles: 'uploadSessions',
  uploadSessions: 'authSessions',
  authSessions: 'authAccounts',
  authAccounts: 'finalAuthSessions',
  finalAuthSessions: 'finalPdfReceipts',
  finalPdfReceipts: 'finalAnalytics',
  finalAnalytics: 'locales',
  locales: 'authRateLimits',
  authRateLimits: 'profile',
  profile: 'user',
  user: null,
};

const scheduleCleanup = async (
  ctx: MutationCtx,
  jobId: Id<'deletionJobs'>,
  delay = 0
) => {
  await ctx.scheduler.runAfter(delay, internal.deletion.processDeletionJob, {
    jobId,
  });
};

const continueAt = async (
  ctx: MutationCtx,
  job: Doc<'deletionJobs'>,
  stage: DeletionStage
) => {
  await ctx.db.patch(job._id, { stage, updatedAt: Date.now() });
  await scheduleCleanup(ctx, job._id);
};

const continueOrAdvance = async (
  ctx: MutationCtx,
  job: Doc<'deletionJobs'>,
  deletedCount: number
) => {
  const stage =
    deletedCount === DELETE_BATCH_SIZE ? job.stage : nextStage[job.stage];
  if (stage) await continueAt(ctx, job, stage);
};

const normalizedUserEmail = (
  user: Doc<'users'> | null
): string | undefined => {
  if (typeof user?.email !== 'string') return undefined;
  try {
    return normalizeEmail(user.email);
  } catch {
    return undefined;
  }
};

const normalizedDeletionEmail = (
  job: Doc<'deletionJobs'>,
  user: Doc<'users'> | null
): string | undefined => job.normalizedEmail ?? normalizedUserEmail(user);

const deleteAuthRateLimits = async (
  ctx: MutationCtx,
  job: Doc<'deletionJobs'>
): Promise<number> => {
  const user = await ctx.db.get(job.userId);
  const email = normalizedDeletionEmail(job, user);
  if (!email) return 0;

  const rows = await ctx.db
    .query('authRateLimits')
    .withIndex('identifier', (q) => q.eq('identifier', email))
    .take(DELETE_BATCH_SIZE);
  for (const row of rows) await ctx.db.delete(row._id);
  return rows.length;
};

export const ensureAccountActive = async (
  ctx: Pick<MutationCtx, 'db'>,
  userId: Id<'users'>
) => {
  const deletionJob = await ctx.db
    .query('deletionJobs')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first();
  if (deletionJob) throw new Error('Account deletion is in progress');
};

export const requestAccountDeletion = mutation({
  args: {},
  returns: v.object({
    jobId: v.id('deletionJobs'),
    unverifiableLegacyStorageObjects: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    if (profile) {
      await ctx.db.patch(profile._id, {
        isPublic: false,
        isDirectoryListed: false,
        accessMode: 'private',
        accessVersion: (profile.accessVersion ?? 0) + 1,
      });
      await removeDirectoryProjectionForProfile(ctx, profile);
      const customDomain = await ctx.db
        .query('customDomains')
        .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
        .unique();
      if (customDomain && customDomain.status !== 'removed') {
        await ctx.db.patch(customDomain._id, {
          desiredState: 'detached',
          status: 'removing',
          nextAttemptAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
    const user = await ctx.db.get(userId);
    const normalizedEmail = normalizedUserEmail(user);

    const existingJob = await ctx.db
      .query('deletionJobs')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
    if (existingJob) {
      await ctx.db.patch(existingJob._id, {
        ...(normalizedEmail ? { normalizedEmail } : {}),
        updatedAt: Date.now(),
      });
      await scheduleCleanup(ctx, existingJob._id);
      return {
        jobId: existingJob._id,
        unverifiableLegacyStorageObjects: existingJob.legacyStorageIds.length,
      };
    }

    const referencedStorageIds = Array.from(
      new Set(
        (profile ? enumerateProfileManagedMedia(profile) : []).flatMap(
          (reference) => {
            const storageId = ctx.db.system.normalizeId(
              '_storage',
              reference.storageId
            );
            return storageId ? [storageId] : [];
          }
        )
      )
    );
    const legacyStorageIds: Id<'_storage'>[] = [];
    for (const storageId of referencedStorageIds) {
      const trackedFile = await ctx.db
        .query('uploadedFiles')
        .withIndex('by_storage', (q) => q.eq('storageId', storageId))
        .unique();
      if (!trackedFile) legacyStorageIds.push(storageId);
    }
    const now = Date.now();
    const jobId = await ctx.db.insert('deletionJobs', {
      userId,
      profileId: profile?._id,
      stage: 'customDomain',
      legacyStorageIds,
      ...(normalizedEmail ? { normalizedEmail } : {}),
      createdAt: now,
      updatedAt: now,
    });

    await scheduleCleanup(ctx, jobId, INITIAL_CLEANUP_DELAY_MS);
    return {
      jobId,
      unverifiableLegacyStorageObjects: legacyStorageIds.length,
    };
  },
});

export const resumeStalledDeletionJobs = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    const jobs = await ctx.db
      .query('deletionJobs')
      .withIndex('by_updated_at')
      .order('asc')
      .take(MAX_RESUME_JOBS);
    let resumed = 0;

    for (const job of jobs) {
      const lastActivityAt = Math.max(
        job.updatedAt ?? job.createdAt,
        job.lastAttemptAt ?? 0
      );
      if (lastActivityAt > now - STALE_DELETION_JOB_MS) continue;

      await ctx.db.patch(job._id, { updatedAt: now });
      await scheduleCleanup(ctx, job._id);
      resumed += 1;
    }
    return resumed;
  },
});

export const processDeletionJob = internalMutation({
  args: { jobId: v.id('deletionJobs') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    const now = Date.now();
    await ctx.db.patch(job._id, { lastAttemptAt: now, updatedAt: now });
    const profileId = job.profileId;

    if (job.stage === 'customDomain') {
      const domain = profileId
        ? await ctx.db
            .query('customDomains')
            .withIndex('by_profile', (q) => q.eq('profileId', profileId))
            .unique()
        : null;
      const domainPolicy = accountDeletionCustomDomainPolicy(domain);
      if (domainPolicy === 'advance') {
        await continueAt(ctx, job, 'pdfReceipts');
        return null;
      }
      if (!domain) return null;
      if (domainPolicy === 'delete') {
        await ctx.db.delete(domain._id);
        await continueAt(ctx, job, 'pdfReceipts');
        return null;
      }
      await ctx.db.patch(domain._id, {
        desiredState: 'detached',
        status: 'removing',
        nextAttemptAt: now,
        updatedAt: now,
      });
      await ctx.scheduler.runAfter(
        0,
        internal.customDomainsNode.reconcileDue,
        {}
      );
      await scheduleCleanup(ctx, job._id, 60_000);
      return null;
    }

    if (job.stage === 'pdfReceipts' || job.stage === 'finalPdfReceipts') {
      const rows = profileId
        ? await ctx.db
            .query('pdfDownloadReceipts')
            .withIndex('by_profile', (q) => q.eq('profileId', profileId))
            .take(DELETE_BATCH_SIZE)
        : [];
      for (const row of rows) await ctx.db.delete(row._id);
      await continueOrAdvance(ctx, job, rows.length);
      return null;
    }

    if (job.stage === 'accessGrants') {
      const rows = profileId
        ? await ctx.db
            .query('profileAccessGrants')
            .withIndex('by_profile', (q) => q.eq('profileId', profileId))
            .take(DELETE_BATCH_SIZE)
        : [];
      for (const row of rows) await ctx.db.delete(row._id);
      await continueOrAdvance(ctx, job, rows.length);
      return null;
    }

    if (job.stage === 'passcodes') {
      const rows = profileId
        ? await ctx.db
            .query('profilePasscodes')
            .withIndex('by_profile', (q) => q.eq('profileId', profileId))
            .take(DELETE_BATCH_SIZE)
        : [];
      for (const row of rows) await ctx.db.delete(row._id);
      await continueOrAdvance(ctx, job, rows.length);
      return null;
    }

    if (job.stage === 'analytics' || job.stage === 'finalAnalytics') {
      const rows = profileId
        ? await ctx.db
            .query('profileAnalytics')
            .withIndex('by_profile', (q) => q.eq('profileId', profileId))
            .take(DELETE_BATCH_SIZE)
        : [];
      for (const row of rows) await ctx.db.delete(row._id);
      await continueOrAdvance(ctx, job, rows.length);
      return null;
    }

    if (job.stage === 'messages') {
      const rows = profileId
        ? await ctx.db
            .query('contactMessages')
            .withIndex('by_profile', (q) => q.eq('profileId', profileId))
            .take(DELETE_BATCH_SIZE)
        : [];
      for (const row of rows) await ctx.db.delete(row._id);
      await continueOrAdvance(ctx, job, rows.length);
      return null;
    }

    if (job.stage === 'locales') {
      const rows = profileId
        ? await ctx.db
            .query('profileLocales')
            .withIndex('by_profile', (q) => q.eq('profileId', profileId))
            .take(DELETE_BATCH_SIZE)
        : [];
      for (const row of rows) await ctx.db.delete(row._id);
      await continueOrAdvance(ctx, job, rows.length);
      return null;
    }

    if (job.stage === 'versions') {
      const rows = profileId
        ? await ctx.db
            .query('resumeVersions')
            .withIndex('by_profile', (q) => q.eq('profileId', profileId))
            .take(DELETE_BATCH_SIZE)
        : [];
      for (const row of rows) await ctx.db.delete(row._id);
      await continueOrAdvance(ctx, job, rows.length);
      return null;
    }

    if (job.stage === 'testimonials') {
      const rows = profileId
        ? await ctx.db
            .query('testimonials')
            .withIndex('by_profile', (q) => q.eq('profileId', profileId))
            .take(DELETE_BATCH_SIZE)
        : [];
      for (const row of rows) await ctx.db.delete(row._id);
      await continueOrAdvance(ctx, job, rows.length);
      return null;
    }

    if (job.stage === 'trackedFiles') {
      const rows = await ctx.db
        .query('uploadedFiles')
        .withIndex('by_user', (q) => q.eq('userId', job.userId))
        .take(DELETE_BATCH_SIZE);
      for (const row of rows) {
        if (await ctx.db.system.get(row.storageId)) {
          await ctx.storage.delete(row.storageId);
        }
        await ctx.db.delete(row._id);
      }
      await continueOrAdvance(ctx, job, rows.length);
      return null;
    }

    if (job.stage === 'legacyFiles') {
      const storageIds = job.legacyStorageIds.slice(0, DELETE_BATCH_SIZE);
      // These profile references predate uploadedFiles ownership tracking.
      // Leave their blobs orphaned instead of guessing ownership and deleting.
      const remaining = job.legacyStorageIds.slice(storageIds.length);
      if (remaining.length > 0) {
        await ctx.db.patch(job._id, {
          legacyStorageIds: remaining,
          updatedAt: Date.now(),
        });
        await scheduleCleanup(ctx, job._id);
      } else {
        await continueAt(ctx, job, 'uploadSessions');
      }
      return null;
    }

    if (job.stage === 'uploadSessions') {
      const rows = await ctx.db
        .query('uploadSessions')
        .withIndex('by_user', (q) => q.eq('userId', job.userId))
        .take(DELETE_BATCH_SIZE);
      for (const row of rows) {
        if (row.storageId && row.state !== 'completed') {
          const [profile, metadata, tracked] = await Promise.all([
            row.profileId ? ctx.db.get(row.profileId) : null,
            ctx.db.system.get(row.storageId),
            ctx.db
              .query('uploadedFiles')
              .withIndex('by_storage', (q) => q.eq('storageId', row.storageId!))
              .unique(),
          ]);
          if (
            metadata &&
            evaluateUploadAbortPolicy({
              sessionUserId: row.userId,
              profileUserId: profile?.userId,
              expectedContentType: row.expectedContentType,
              expectedSize: row.expectedSize,
              sessionCreatedAt: row.createdAt,
              sessionExpiresAt: row.expiresAt,
              recordedStorageId: row.storageId,
              storageId: row.storageId,
              storageCreationTime: metadata._creationTime,
              storageContentType: metadata.contentType,
              storageSize: metadata.size,
              alreadyTracked: Boolean(tracked),
              sessionState: row.state,
            }).shouldDelete
          ) {
            await ctx.storage.delete(row.storageId);
          }
        }
        await ctx.db.delete(row._id);
      }
      await continueOrAdvance(ctx, job, rows.length);
      return null;
    }

    if (job.stage === 'authSessions' || job.stage === 'finalAuthSessions') {
      const session = await ctx.db
        .query('authSessions')
        .withIndex('userId', (q) => q.eq('userId', job.userId))
        .first();
      if (!session) {
        const stage = nextStage[job.stage];
        if (stage) await continueAt(ctx, job, stage);
        return null;
      }

      const refreshTokens = await ctx.db
        .query('authRefreshTokens')
        .withIndex('sessionId', (q) => q.eq('sessionId', session._id))
        .take(DELETE_BATCH_SIZE);
      for (const token of refreshTokens) await ctx.db.delete(token._id);
      if (refreshTokens.length < DELETE_BATCH_SIZE) {
        await ctx.db.delete(session._id);
      }
      await scheduleCleanup(ctx, job._id);
      return null;
    }

    if (job.stage === 'authAccounts') {
      const account = await ctx.db
        .query('authAccounts')
        .withIndex('userIdAndProvider', (q) => q.eq('userId', job.userId))
        .first();
      if (!account) {
        await continueAt(ctx, job, 'finalAuthSessions');
        return null;
      }

      const codes = await ctx.db
        .query('authVerificationCodes')
        .withIndex('accountId', (q) => q.eq('accountId', account._id))
        .take(DELETE_BATCH_SIZE);
      for (const code of codes) await ctx.db.delete(code._id);
      if (codes.length < DELETE_BATCH_SIZE) {
        await ctx.db.delete(account._id);
      }
      await scheduleCleanup(ctx, job._id);
      return null;
    }

    if (job.stage === 'authRateLimits') {
      const deletedCount = await deleteAuthRateLimits(ctx, job);
      await continueOrAdvance(ctx, job, deletedCount);
      return null;
    }

    if (job.stage === 'profile') {
      if (job.profileId) {
        const profile = await ctx.db.get(job.profileId);
        if (profile?.userId === job.userId) {
          await removeDirectoryProjectionForProfile(ctx, profile);
          await ctx.db.delete(profile._id);
        }
      }
      await continueAt(ctx, job, 'user');
      return null;
    }

    const deletedRateLimits = await deleteAuthRateLimits(ctx, job);
    if (deletedRateLimits === DELETE_BATCH_SIZE) {
      await scheduleCleanup(ctx, job._id);
      return null;
    }
    const user = await ctx.db.get(job.userId);
    if (user) await ctx.db.delete(user._id);
    await ctx.db.delete(job._id);
    return null;
  },
});
