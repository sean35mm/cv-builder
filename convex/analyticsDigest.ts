import { v } from 'convex/values';
import { internalAction, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { analyticsDigestConfigured } from '../lib/features';

const CANDIDATE_LIMIT = 25;
const EVENT_LIMIT = 5_000;

export const getCandidates = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      email: v.string(),
      name: v.string(),
      views: v.number(),
      downloads: v.number(),
    })
  ),
  handler: async (ctx) => {
    const profiles = await ctx.db.query('profiles').take(CANDIDATE_LIMIT * 4);
    const candidates = [];
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const profile of profiles) {
      if (
        candidates.length >= CANDIDATE_LIMIT ||
        profile.analyticsDigestOptIn !== true ||
        profile.analyticsEnabled === false
      ) {
        continue;
      }
      const deletion = await ctx.db
        .query('deletionJobs')
        .withIndex('by_user', (q) => q.eq('userId', profile.userId))
        .first();
      if (deletion) continue;
      const user = await ctx.db.get(profile.userId);
      if (typeof user?.email !== 'string') continue;
      const events = await ctx.db
        .query('profileAnalytics')
        .withIndex('by_profile_and_created', (q) =>
          q.eq('profileId', profile._id).gte('createdAt', since)
        )
        .take(EVENT_LIMIT);
      candidates.push({
        email: user.email,
        name: profile.name,
        views: events.filter((event) => event.eventType === 'view').length,
        downloads: events.filter((event) => event.eventType === 'pdf_download')
          .length,
      });
    }
    return candidates;
  },
});

export const sendWeekly = internalAction({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    if (!analyticsDigestConfigured()) return 0;
    const key = process.env.AUTH_RESEND_KEY!;
    const from = process.env.AUTH_EMAIL!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
    if (!siteUrl) return 0;
    const candidates = await ctx.runQuery(
      internal.analyticsDigest.getCandidates,
      {}
    );
    let sent = 0;
    for (const candidate of candidates) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: candidate.email,
          subject: 'Your weekly OpenCV profile summary',
          text: `${candidate.name}, your profile had ${candidate.views} views and ${candidate.downloads} PDF downloads this week. Manage or unsubscribe: ${siteUrl}/editor`,
        }),
      });
      if (response.ok) sent += 1;
    }
    return sent;
  },
});
