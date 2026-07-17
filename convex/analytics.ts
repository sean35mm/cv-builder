import { internalMutation, query, mutation } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { optionalText, validateReportingDays } from './validation';
import { rateLimiter } from './rateLimits';
import { resolveEffectivePublicProfileState } from './publicProfiles';
import { normalizeUtmValue } from '../lib/analytics/privacy';
import {
  ANALYTICS_RETENTION_DELETE_BATCH_SIZE,
  analyticsRetentionCutoff,
  analyticsRetentionDrainPolicy,
} from '../lib/analytics/retention';

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
    countryCode: v.optional(v.string()),
    deviceCategory: v.optional(
      v.union(
        v.literal('desktop'),
        v.literal('mobile'),
        v.literal('tablet'),
        v.literal('other')
      )
    ),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const referrer = normalizeReferrer(args.referrer);
    const profile = await ctx.db.get(args.profileId);
    if (
      !profile ||
      profile.analyticsEnabled === false ||
      !(await resolveEffectivePublicProfileState(ctx, profile))
    ) {
      throw new Error('Profile not found');
    }
    const deletion = await ctx.db
      .query('deletionJobs')
      .withIndex('by_user', (q) => q.eq('userId', profile.userId))
      .first();
    if (deletion) throw new Error('Profile not found');

    await rateLimiter.limit(ctx, 'analyticsEvent', {
      key: args.profileId,
      throws: true,
    });

    await ctx.db.insert('profileAnalytics', {
      profileId: args.profileId,
      eventType: 'view',
      referrer,
      countryCode:
        args.countryCode && /^[A-Z]{2}$/.test(args.countryCode)
          ? args.countryCode
          : undefined,
      deviceCategory: args.deviceCategory,
      utmSource: normalizeUtmValue(args.utmSource),
      utmMedium: normalizeUtmValue(args.utmMedium),
      utmCampaign: normalizeUtmValue(args.utmCampaign),
      createdAt: Date.now(),
    });
    return null;
  },
});

export const getAdvancedStats = query({
  args: { days: v.optional(v.number()) },
  returns: v.object({
    isCapped: v.boolean(),
    countries: v.array(v.object({ value: v.string(), count: v.number() })),
    devices: v.array(v.object({ value: v.string(), count: v.number() })),
    campaigns: v.array(v.object({ value: v.string(), count: v.number() })),
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
    const events = await ctx.db
      .query('profileAnalytics')
      .withIndex('by_profile_and_created', (q) =>
        q
          .eq('profileId', profile._id)
          .gte('createdAt', Date.now() - days * 24 * 60 * 60 * 1000)
      )
      .order('desc')
      .take(EVENT_LIMIT + 1);
    const aggregate = (field: 'countryCode' | 'deviceCategory' | 'utmCampaign') => {
      const counts = new Map<string, number>();
      for (const event of events.slice(0, EVENT_LIMIT)) {
        const value = event[field];
        if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
      }
      return Array.from(counts, ([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
        .slice(0, 20);
    };
    return {
      isCapped: events.length > EVENT_LIMIT,
      countries: aggregate('countryCode'),
      devices: aggregate('deviceCategory'),
      campaigns: aggregate('utmCampaign'),
    };
  },
});

export const deleteExpired = internalMutation({
  args: {},
  returns: v.object({ deleted: v.number(), rescheduled: v.boolean() }),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query('profileAnalytics')
      .withIndex('by_created', (q) =>
        q.lt('createdAt', analyticsRetentionCutoff(Date.now()))
      )
      .order('asc')
      .take(ANALYTICS_RETENTION_DELETE_BATCH_SIZE);
    for (const row of rows) await ctx.db.delete(row._id);
    const policy = analyticsRetentionDrainPolicy(rows.length);
    if (policy.rescheduleImmediately) {
      await ctx.scheduler.runAfter(0, internal.analytics.deleteExpired, {});
    }
    return {
      deleted: rows.length,
      rescheduled: policy.rescheduleImmediately,
    };
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
