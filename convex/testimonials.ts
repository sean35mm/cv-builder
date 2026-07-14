import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { nanoid } from 'nanoid';
import {
  normalizeEmail,
  optionalText,
  requiredText,
  validateRating,
} from './validation';
import { rateLimiter } from './rateLimits';
import { stableRateLimitKey } from './rateLimitKey';
import { resolveEffectivePublicProfileState } from './publicProfiles';
import { ensureAccountActive } from './deletion';
import { isTestimonialRequestActive } from './testimonialExpiry';

export const getTestimonials = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('testimonials'),
      _creationTime: v.number(),
      profileId: v.id('profiles'),
      authorName: v.string(),
      authorEmail: v.string(),
      authorTitle: v.optional(v.string()),
      authorCompany: v.optional(v.string()),
      relationship: v.string(),
      content: v.string(),
      rating: v.optional(v.number()),
      isApproved: v.boolean(),
      createdAt: v.number(),
      approvedAt: v.optional(v.number()),
      requestToken: v.optional(v.string()),
      tokenExpiresAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile) return [];

    const testimonials = await ctx.db
      .query('testimonials')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .order('desc')
      .take(100);

    return testimonials;
  },
});

export const getPublicTestimonials = query({
  args: {
    profileId: v.id('profiles'),
  },
  returns: v.array(
    v.object({
      _id: v.id('testimonials'),
      authorName: v.string(),
      authorTitle: v.optional(v.string()),
      authorCompany: v.optional(v.string()),
      relationship: v.string(),
      content: v.string(),
      rating: v.optional(v.number()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile?.isPublic) return [];
    const state = await resolveEffectivePublicProfileState(ctx, profile);
    if (!state?.sectionsVisibility.testimonials) return [];

    const testimonials = await ctx.db
      .query('testimonials')
      .withIndex('by_profile_and_approved', (q) =>
        q.eq('profileId', args.profileId).eq('isApproved', true)
      )
      .order('desc')
      .take(50);

    return testimonials.map((t) => ({
      _id: t._id,
      authorName: t.authorName,
      authorTitle: t.authorTitle,
      authorCompany: t.authorCompany,
      relationship: t.relationship,
      content: t.content,
      rating: t.rating,
      createdAt: t.createdAt,
    }));
  },
});

export const getTestimonialByToken = query({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.object({
      profileId: v.id('profiles'),
      profileName: v.string(),
      expiresAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const token = requiredText(args.token, 'Token', 64);
    const testimonial = await ctx.db
      .query('testimonials')
      .withIndex('by_token', (q) => q.eq('requestToken', token))
      .first();

    if (!testimonial) return null;

    if (!isTestimonialRequestActive(testimonial.tokenExpiresAt, Date.now())) {
      return null;
    }

    const profile = await ctx.db.get(testimonial.profileId);
    if (!profile) return null;

    return {
      profileId: testimonial.profileId,
      profileName: profile.name,
      expiresAt: testimonial.tokenExpiresAt,
    };
  },
});

export const submitTestimonial = mutation({
  args: {
    token: v.string(),
    authorName: v.string(),
    authorEmail: v.string(),
    authorTitle: v.optional(v.string()),
    authorCompany: v.optional(v.string()),
    relationship: v.string(),
    content: v.string(),
    rating: v.optional(v.number()),
  },
  returns: v.id('testimonials'),
  handler: async (ctx, args) => {
    const token = requiredText(args.token, 'Token', 64);
    const authorName = requiredText(args.authorName, 'Author name', 120);
    const authorEmail = normalizeEmail(args.authorEmail, 'Author email');
    const authorTitle = optionalText(args.authorTitle, 'Author title', 160);
    const authorCompany = optionalText(
      args.authorCompany,
      'Author company',
      160
    );
    const relationship = requiredText(args.relationship, 'Relationship', 160);
    const content = requiredText(args.content, 'Testimonial', 3000);
    const rating = validateRating(args.rating);
    const existingTestimonial = await ctx.db
      .query('testimonials')
      .withIndex('by_token', (q) => q.eq('requestToken', token))
      .first();

    if (!existingTestimonial) {
      throw new Error('Invalid or expired request token');
    }

    if (
      !isTestimonialRequestActive(
        existingTestimonial.tokenExpiresAt,
        Date.now()
      )
    ) {
      throw new Error('Request token has expired');
    }

    const requestProfile = await ctx.db.get(existingTestimonial.profileId);
    if (!requestProfile) throw new Error('Invalid or expired request token');
    await ensureAccountActive(ctx, requestProfile.userId);

    await rateLimiter.limit(ctx, 'testimonialSubmissionPerToken', {
      key: await stableRateLimitKey('testimonial-token', token),
      throws: true,
    });

    await ctx.db.patch(existingTestimonial._id, {
      authorName,
      authorEmail,
      authorTitle,
      authorCompany,
      relationship,
      content,
      rating,
      requestToken: undefined,
      tokenExpiresAt: undefined,
    });

    return existingTestimonial._id;
  },
});

export const createTestimonialRequest = mutation({
  args: {},
  returns: v.object({
    testimonialId: v.id('testimonials'),
    token: v.string(),
    expiresAt: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureAccountActive(ctx, userId);

    await rateLimiter.limit(ctx, 'testimonialRequestPerUser', {
      key: userId,
      throws: true,
    });

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile) throw new Error('Profile not found');

    const now = Date.now();
    const expiredRequests = await ctx.db
      .query('testimonials')
      .withIndex('by_profile_and_expiration', (q) =>
        q.eq('profileId', profile._id).lt('tokenExpiresAt', now)
      )
      .take(100);
    for (const request of expiredRequests) {
      if (request.requestToken && !request.content) {
        await ctx.db.delete(request._id);
      }
    }

    const existingRequests = await ctx.db
      .query('testimonials')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .take(100);
    if (existingRequests.length >= 100) {
      throw new Error('Testimonial request limit reached');
    }

    const token = nanoid(16);
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;

    const testimonialId = await ctx.db.insert('testimonials', {
      profileId: profile._id,
      authorName: '',
      authorEmail: '',
      relationship: '',
      content: '',
      isApproved: false,
      requestToken: token,
      tokenExpiresAt: expiresAt,
      createdAt: now,
    });

    return { testimonialId, token, expiresAt };
  },
});

export const revokeTestimonialRequest = mutation({
  args: {
    testimonialId: v.id('testimonials'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureAccountActive(ctx, userId);

    const testimonial = await ctx.db.get(args.testimonialId);
    if (!testimonial) return null;

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile || testimonial.profileId !== profile._id) {
      throw new Error('Not authorized');
    }
    if (!testimonial.requestToken || testimonial.content) {
      throw new Error('Testimonial request is no longer pending');
    }

    await ctx.db.delete(testimonial._id);
    return null;
  },
});

export const approveTestimonial = mutation({
  args: {
    testimonialId: v.id('testimonials'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureAccountActive(ctx, userId);

    const testimonial = await ctx.db.get(args.testimonialId);
    if (!testimonial) throw new Error('Testimonial not found');

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile || testimonial.profileId !== profile._id) {
      throw new Error('Not authorized');
    }

    await ctx.db.patch(args.testimonialId, {
      isApproved: true,
      approvedAt: Date.now(),
    });
  },
});

export const rejectTestimonial = mutation({
  args: {
    testimonialId: v.id('testimonials'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureAccountActive(ctx, userId);

    const testimonial = await ctx.db.get(args.testimonialId);
    if (!testimonial) throw new Error('Testimonial not found');

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile || testimonial.profileId !== profile._id) {
      throw new Error('Not authorized');
    }

    await ctx.db.delete(args.testimonialId);
  },
});

export const deleteTestimonial = mutation({
  args: {
    testimonialId: v.id('testimonials'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureAccountActive(ctx, userId);

    const testimonial = await ctx.db.get(args.testimonialId);
    if (!testimonial) throw new Error('Testimonial not found');

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile || testimonial.profileId !== profile._id) {
      throw new Error('Not authorized');
    }

    await ctx.db.delete(args.testimonialId);
  },
});
