import { httpAction, query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

export const recordEvent = mutation({
  args: {
    profileId: v.id('profiles'),
    eventType: v.union(
      v.literal('view'),
      v.literal('pdf_download'),
      v.literal('link_click')
    ),
    referrer: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    linkType: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert('profileAnalytics', {
      profileId: args.profileId,
      eventType: args.eventType,
      referrer: args.referrer,
      countryCode: args.countryCode,
      userAgent: undefined,
      linkType: args.linkType,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const getProfileStats = query({
  args: {
    days: v.optional(v.number()),
  },
  returns: v.object({
    totalViews: v.number(),
    totalPdfDownloads: v.number(),
    totalLinkClicks: v.number(),
    viewsByDay: v.array(
      v.object({
        date: v.string(),
        count: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (!profile) throw new Error('Profile not found');

    const days = args.days ?? 30;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query('profileAnalytics')
      .withIndex('by_profile_and_created', (q) =>
        q.eq('profileId', profile._id).gte('createdAt', since)
      )
      .collect();

    const totalViews = events.filter((e) => e.eventType === 'view').length;
    const totalPdfDownloads = events.filter(
      (e) => e.eventType === 'pdf_download'
    ).length;
    const totalLinkClicks = events.filter(
      (e) => e.eventType === 'link_click'
    ).length;

    const viewsByDayMap = new Map<string, number>();
    events
      .filter((e) => e.eventType === 'view')
      .forEach((e) => {
        const date = new Date(e.createdAt).toISOString().split('T')[0];
        viewsByDayMap.set(date, (viewsByDayMap.get(date) ?? 0) + 1);
      });

    const viewsByDay = Array.from(viewsByDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { totalViews, totalPdfDownloads, totalLinkClicks, viewsByDay };
  },
});

export const getReferrers = query({
  args: {
    days: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      referrer: v.string(),
      count: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (!profile) throw new Error('Profile not found');

    const days = args.days ?? 30;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query('profileAnalytics')
      .withIndex('by_profile_and_created', (q) =>
        q.eq('profileId', profile._id).gte('createdAt', since)
      )
      .collect();

    const referrerMap = new Map<string, number>();
    events.forEach((e) => {
      if (e.referrer) {
        referrerMap.set(e.referrer, (referrerMap.get(e.referrer) ?? 0) + 1);
      }
    });

    return Array.from(referrerMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },
});

export const getGeography = query({
  args: {
    days: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      countryCode: v.string(),
      count: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (!profile) throw new Error('Profile not found');

    const days = args.days ?? 30;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query('profileAnalytics')
      .withIndex('by_profile_and_created', (q) =>
        q.eq('profileId', profile._id).gte('createdAt', since)
      )
      .collect();

    const geoMap = new Map<string, number>();
    events.forEach((e) => {
      if (e.countryCode) {
        geoMap.set(e.countryCode, (geoMap.get(e.countryCode) ?? 0) + 1);
      }
    });

    return Array.from(geoMap.entries())
      .map(([countryCode, count]) => ({ countryCode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },
});

export const getLinkClicks = query({
  args: {
    days: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      linkType: v.string(),
      count: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (!profile) throw new Error('Profile not found');

    const days = args.days ?? 30;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query('profileAnalytics')
      .withIndex('by_profile_and_type', (q) =>
        q.eq('profileId', profile._id).eq('eventType', 'link_click')
      )
      .filter((q) => q.gte(q.field('createdAt'), since))
      .collect();

    const linkMap = new Map<string, number>();
    events.forEach((e) => {
      if (e.linkType) {
        linkMap.set(e.linkType, (linkMap.get(e.linkType) ?? 0) + 1);
      }
    });

    return Array.from(linkMap.entries())
      .map(([linkType, count]) => ({ linkType, count }))
      .sort((a, b) => b.count - a.count);
  },
});
