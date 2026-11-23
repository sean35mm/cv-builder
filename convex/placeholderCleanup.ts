import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import {
  DatabaseReader,
  internalMutation,
  internalQuery,
} from './_generated/server';
import {
  ABANDONED_PLACEHOLDER_MAX_CODES,
  ABANDONED_PLACEHOLDER_MIN_AGE_MS,
  AbandonedPlaceholderDecision,
  classifyAbandonedPlaceholder,
} from './authCleanup';

// Each page reads about ten indexed ranges per user and deletes at most a few
// rows per user, which keeps a page well inside Convex transaction limits.
export const PLACEHOLDER_CLEANUP_PAGE_SIZE = 100;

type PlaceholderInspection = {
  decision: AbandonedPlaceholderDecision;
  accountId?: Id<'authAccounts'>;
  verificationCodeIds: Id<'authVerificationCodes'>[];
};

async function inspectUser(
  db: DatabaseReader,
  user: Doc<'users'>,
  now: number
): Promise<PlaceholderInspection> {
  const [profile, session, accounts, uploadedFile, uploadSession, deletionJob] =
    await Promise.all([
      db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .first(),
      db
        .query('authSessions')
        .withIndex('userId', (q) => q.eq('userId', user._id))
        .first(),
      db
        .query('authAccounts')
        .withIndex('userIdAndProvider', (q) => q.eq('userId', user._id))
        .take(2),
      db
        .query('uploadedFiles')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .first(),
      db
        .query('uploadSessions')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .first(),
      db
        .query('deletionJobs')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .first(),
    ]);
  const account = accounts.length === 1 ? accounts[0] : undefined;
  const verificationCodes = account
    ? await db
        .query('authVerificationCodes')
        .withIndex('accountId', (q) => q.eq('accountId', account._id))
        .take(ABANDONED_PLACEHOLDER_MAX_CODES + 1)
    : [];

  const decision = classifyAbandonedPlaceholder({
    now,
    userCreationTime: user._creationTime,
    userEmail: user.email,
    userEmailVerificationTime: user.emailVerificationTime,
    userPhone: user.phone,
    userPhoneVerificationTime: user.phoneVerificationTime,
    hasProfile: profile !== null,
    hasSession: session !== null,
    hasOwnedRecords:
      uploadedFile !== null || uploadSession !== null || deletionJob !== null,
    accounts,
    verificationCodeExpirations: verificationCodes.map(
      (code) => code.expirationTime
    ),
  });
  return {
    decision,
    accountId: account?._id,
    verificationCodeIds: verificationCodes.map((code) => code._id),
  };
}

const decisionCountsValidator = v.object({
  deleteEmailCodePlaceholder: v.number(),
  deleteDetachedPlaceholder: v.number(),
  keepHasIdentity: v.number(),
  keepVerified: v.number(),
  keepHasProfile: v.number(),
  keepHasSession: v.number(),
  keepHasOwnedRecords: v.number(),
  keepTooRecent: v.number(),
  keepAccountShape: v.number(),
  keepPendingCode: v.number(),
});

const emptyDecisionCounts = (): Record<
  AbandonedPlaceholderDecision,
  number
> => ({
  deleteEmailCodePlaceholder: 0,
  deleteDetachedPlaceholder: 0,
  keepHasIdentity: 0,
  keepVerified: 0,
  keepHasProfile: 0,
  keepHasSession: 0,
  keepHasOwnedRecords: 0,
  keepTooRecent: 0,
  keepAccountShape: 0,
  keepPendingCode: 0,
});

const pageResultValidator = {
  scanned: v.number(),
  counts: decisionCountsValidator,
  isDone: v.boolean(),
  continueCursor: v.string(),
};

// Read-only dry run of one page. Follow continueCursor until isDone to cover
// every user. Returns counts only, never identities.
export const previewAbandonedPlaceholders = internalQuery({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.object(pageResultValidator),
  handler: async (ctx, args) => {
    const now = Date.now();
    const page = await ctx.db.query('users').paginate({
      numItems: PLACEHOLDER_CLEANUP_PAGE_SIZE,
      cursor: args.cursor ?? null,
    });
    const counts = emptyDecisionCounts();
    for (const user of page.page) {
      const { decision } = await inspectUser(ctx.db, user, now);
      counts[decision]++;
    }
    return {
      scanned: page.page.length,
      counts,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});

// Deletes abandoned email sign-in placeholders older than 24 hours, one page
// per transaction, and schedules the next page until every user is checked.
// Rerunning is safe: deleted rows are gone and kept rows are reclassified.
// authRateLimits rows are left alone so a repeat sender stays throttled.
export const cleanupAbandonedPlaceholders = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.object({
    ...pageResultValidator,
    deletedUsers: v.number(),
    deletedAccounts: v.number(),
    deletedVerificationCodes: v.number(),
    scheduledNext: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const page = await ctx.db.query('users').paginate({
      numItems: PLACEHOLDER_CLEANUP_PAGE_SIZE,
      cursor: args.cursor ?? null,
    });
    const counts = emptyDecisionCounts();
    let deletedUsers = 0;
    let deletedAccounts = 0;
    let deletedVerificationCodes = 0;

    for (const user of page.page) {
      const inspection = await inspectUser(ctx.db, user, now);
      counts[inspection.decision]++;
      if (
        inspection.decision !== 'deleteEmailCodePlaceholder' &&
        inspection.decision !== 'deleteDetachedPlaceholder'
      ) {
        continue;
      }
      for (const codeId of inspection.verificationCodeIds) {
        await ctx.db.delete(codeId);
        deletedVerificationCodes++;
      }
      if (inspection.accountId) {
        await ctx.db.delete(inspection.accountId);
        deletedAccounts++;
      }
      await ctx.db.delete(user._id);
      deletedUsers++;
    }

    // Users are paginated oldest first, so once a page reaches users newer
    // than the age cutoff, every later user is too recent to delete.
    const reachedRecentUsers = page.page.some(
      (user) => user._creationTime > now - ABANDONED_PLACEHOLDER_MIN_AGE_MS
    );
    const scheduledNext = !page.isDone && !reachedRecentUsers;
    if (scheduledNext) {
      await ctx.scheduler.runAfter(
        0,
        internal.placeholderCleanup.cleanupAbandonedPlaceholders,
        { cursor: page.continueCursor }
      );
    }

    return {
      scanned: page.page.length,
      counts,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
      deletedUsers,
      deletedAccounts,
      deletedVerificationCodes,
      scheduledNext,
    };
  },
});
