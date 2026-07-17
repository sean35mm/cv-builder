import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { ensureAccountActive } from './deletion';
import { rateLimiter } from './rateLimits';

export const consumeQuota = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureAccountActive(ctx, userId);
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    if (!profile) throw new Error('Profile not found');
    await rateLimiter.limit(ctx, 'aiGlobal', { key: 'global', throws: true });
    await rateLimiter.limit(ctx, 'aiPerUser', { key: userId, throws: true });
    return null;
  },
});
