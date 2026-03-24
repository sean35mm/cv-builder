import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { nanoid } from 'nanoid';

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
      .collect();

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
    const testimonials = await ctx.db
      .query('testimonials')
      .withIndex('by_profile_and_approved', (q) =>
        q.eq('profileId', args.profileId).eq('isApproved', true)
      )
      .order('desc')
      .collect();

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

export const createRequestToken = mutation({
  args: {},
  returns: v.object({
    token: v.string(),
    expiresAt: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile) throw new Error('Profile not found');

    const token = nanoid(16);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    return { token, expiresAt };
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
    const testimonial = await ctx.db
      .query('testimonials')
      .withIndex('by_token', (q) => q.eq('requestToken', args.token))
      .first();

    if (!testimonial) return null;

    if (testimonial.tokenExpiresAt && testimonial.tokenExpiresAt < Date.now()) {
      return null;
    }

    const profile = await ctx.db.get(testimonial.profileId);
    if (!profile) return null;

    return {
      profileId: testimonial.profileId,
      profileName: profile.name,
      expiresAt: testimonial.tokenExpiresAt ?? Date.now(),
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
    const existingTestimonial = await ctx.db
      .query('testimonials')
      .withIndex('by_token', (q) => q.eq('requestToken', args.token))
      .first();

    if (!existingTestimonial) {
      throw new Error('Invalid or expired request token');
    }

    if (
      existingTestimonial.tokenExpiresAt &&
      existingTestimonial.tokenExpiresAt < Date.now()
    ) {
      throw new Error('Request token has expired');
    }

    await ctx.db.patch(existingTestimonial._id, {
      authorName: args.authorName,
      authorEmail: args.authorEmail,
      authorTitle: args.authorTitle,
      authorCompany: args.authorCompany,
      relationship: args.relationship,
      content: args.content,
      rating: args.rating,
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

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile) throw new Error('Profile not found');

    const token = nanoid(16);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const testimonialId = await ctx.db.insert('testimonials', {
      profileId: profile._id,
      authorName: '',
      authorEmail: '',
      relationship: '',
      content: '',
      isApproved: false,
      requestToken: token,
      tokenExpiresAt: expiresAt,
      createdAt: Date.now(),
    });

    return { testimonialId, token, expiresAt };
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
