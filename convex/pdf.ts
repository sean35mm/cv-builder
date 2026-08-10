import { nanoid } from 'nanoid';
import { internalMutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { rateLimiter } from './rateLimits';
import { resolveEffectivePublicProfileState } from './publicProfiles';

const PDF_RECEIPT_LENGTH = 48;
const PDF_RECEIPT_TTL_MS = 5 * 60 * 1000;
const EXPIRED_RECEIPT_CLEANUP_LIMIT = 20;

async function cleanupExpiredReceipts(
  ctx: MutationCtx,
  now: number
): Promise<void> {
  const expiredReceipts = await ctx.db
    .query('pdfDownloadReceipts')
    .withIndex('by_expiration', (q) => q.lt('expiresAt', now))
    .take(EXPIRED_RECEIPT_CLEANUP_LIMIT);
  for (const expiredReceipt of expiredReceipts) {
    await ctx.db.delete(expiredReceipt._id);
  }
}

export const authorizePdf = internalMutation({
  args: {
    username: v.string(),
    callerHash: v.string(),
  },
  returns: v.union(
    v.object({
      profileId: v.id('profiles'),
      username: v.string(),
      receipt: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const username = args.username.trim();
    if (!username || username.length > 100 || /[/?#%\\]/.test(username)) {
      throw new Error('Username is invalid');
    }
    if (!/^[a-f0-9]{64}$/.test(args.callerHash)) {
      throw new Error('Caller identifier is invalid');
    }

    await rateLimiter.limit(ctx, 'pdfPerCaller', {
      key: args.callerHash,
      throws: true,
    });
    const now = Date.now();
    await cleanupExpiredReceipts(ctx, now);

    const exactProfile = await ctx.db
      .query('profiles')
      .withIndex('by_username', (q) => q.eq('username', username))
      .unique();
    const normalizedCandidate = username.toLowerCase();
    const normalizedProfile = /^[a-z0-9_-]{3,30}$/.test(normalizedCandidate)
      ? await ctx.db
          .query('profiles')
          .withIndex('by_normalized_username', (q) =>
            q.eq('normalizedUsername', normalizedCandidate)
          )
          .unique()
      : null;
    const profile =
      exactProfile ??
      normalizedProfile ??
      (normalizedCandidate !== username &&
      /^[a-z0-9_-]{3,30}$/.test(normalizedCandidate)
        ? await ctx.db
            .query('profiles')
            .withIndex('by_username', (q) =>
              q.eq('username', normalizedCandidate)
            )
            .unique()
        : null);

    if (!profile || !(await resolveEffectivePublicProfileState(ctx, profile))) {
      return null;
    }

    await rateLimiter.limit(ctx, 'pdfPerProfile', {
      key: profile._id,
      throws: true,
    });

    const receipt = nanoid(PDF_RECEIPT_LENGTH);
    await ctx.db.insert('pdfDownloadReceipts', {
      receipt,
      profileId: profile._id,
      callerHash: args.callerHash,
      createdAt: now,
      expiresAt: now + PDF_RECEIPT_TTL_MS,
    });

    return { profileId: profile._id, username: profile.username, receipt };
  },
});

export const completeDownload = internalMutation({
  args: {
    receipt: v.string(),
    callerHash: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (
      !new RegExp(`^[A-Za-z0-9_-]{${PDF_RECEIPT_LENGTH}}$`).test(
        args.receipt
      ) ||
      !/^[a-f0-9]{64}$/.test(args.callerHash)
    ) {
      throw new Error('PDF receipt is invalid');
    }

    const receipt = await ctx.db
      .query('pdfDownloadReceipts')
      .withIndex('by_receipt', (q) => q.eq('receipt', args.receipt))
      .unique();
    if (!receipt) return null;

    if (receipt.expiresAt <= Date.now()) {
      await ctx.db.delete(receipt._id);
      return null;
    }
    if (receipt.callerHash !== args.callerHash) return null;

    await ctx.db.delete(receipt._id);
    const profile = await ctx.db.get(receipt.profileId);
    if (!profile || profile.analyticsEnabled === false) return null;
    const deletionJob = await ctx.db
      .query('deletionJobs')
      .withIndex('by_user', (q) => q.eq('userId', profile.userId))
      .first();
    if (deletionJob) return null;

    await ctx.db.insert('profileAnalytics', {
      profileId: receipt.profileId,
      eventType: 'pdf_download',
      createdAt: Date.now(),
    });
    return null;
  },
});
