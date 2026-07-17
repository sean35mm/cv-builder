import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { ensureAccountActive } from './deletion';

export const update = mutation({
  args: {
    allowEmbed: v.boolean(),
    analyticsEnabled: v.boolean(),
    analyticsDigestOptIn: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureAccountActive(ctx, userId);
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    if (!profile) throw new Error('Profile not found');
    await ctx.db.patch(profile._id, args);
    return null;
  },
});
