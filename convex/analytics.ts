import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { optionalText, validateReportingDays } from './validation';
import { rateLimiter } from './rateLimits';
import { resolveEffectivePublicProfileState } from './publicProfiles';

const EVENT_LIMIT = 10000;

function normalizeReferrer(value?: string): string | undefined {
  const referrer = optionalText(value, 'Referrer', 253);
  if (!referrer) return undefined;

  try {
    const parsed = new URL(`https://${referrer}`);
    if (
      parsed.hostname.toLowerCase() !== referrer.toLowerCase() ||
      parsed.username ||
      parsed.password ||
      parsed.port ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error('Referrer is invalid');
    }
    return parsed.hostname.toLowerCase();
  } catch {
    throw new Error('Referrer is invalid');
  }
}

export const recordView = mutation({
  args: {
    profileId: v.id('profiles'),
    referrer: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const referrer = normalizeReferrer(args.referrer);
    const profile = await ctx.db.get(args.profileId);
    if (!profile || !(await resolveEffectivePublicProfileState(ctx, profile))) {
      throw new Error('Profile not found');
    }

    await rateLimiter.limit(ctx, 'analyticsEvent', {
      key: args.profileId,
      throws: true,
    });

    await ctx.db.insert('profileAnalytics', {
      profileId: args.profileId,
      eventType: 'view',
      referrer,
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
    isCapped: v.boolean(),
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

    const days = validateReportingDays(args.days);
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const rangeEvents = await ctx.db
      .query('profileAnalytics')
      .withIndex('by_profile_and_created', (q) =>
        q.eq('profileId', profile._id).gte('createdAt', since)
      )
      .order('desc')
      .take(EVENT_LIMIT + 1);
    const isCapped = rangeEvents.length > EVENT_LIMIT;
    const events = rangeEvents.slice(0, EVENT_LIMIT);

    const totalViews = events.filter((e) => e.eventType === 'view').length;
    const totalPdfDownloads = events.filter(
      (e) => e.eventType === 'pdf_download'
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

    return { totalViews, totalPdfDownloads, isCapped, viewsByDay };
  },
});

export const getReferrers = query({
  args: {
    days: v.optional(v.number()),
  },
  returns: v.object({
    items: v.array(
      v.object({
        referrer: v.string(),
        count: v.number(),
      })
    ),
    isCapped: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (!profile) throw new Error('Profile not found');

    const days = validateReportingDays(args.days);
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const rangeEvents = await ctx.db
      .query('profileAnalytics')
      .withIndex('by_profile_and_created', (q) =>
        q.eq('profileId', profile._id).gte('createdAt', since)
      )
      .order('desc')
      .take(EVENT_LIMIT + 1);
    const isCapped = rangeEvents.length > EVENT_LIMIT;
    const events = rangeEvents.slice(0, EVENT_LIMIT);

    const referrerMap = new Map<string, number>();
    events.forEach((e) => {
      if (e.eventType === 'view' && e.referrer) {
        referrerMap.set(e.referrer, (referrerMap.get(e.referrer) ?? 0) + 1);
      }
    });

    const items = Array.from(referrerMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    return { items, isCapped };
  },
});
