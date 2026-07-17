import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import {
  paginationOptsValidator,
  paginationResultValidator,
} from 'convex/server';
import { normalizeEmail, requiredText } from './validation';
import { rateLimiter } from './rateLimits';
import { stableRateLimitKey } from './rateLimitKey';
import { ensureAccountActive } from './deletion';
import { resolveEffectivePublicProfileState } from './publicProfiles';

export const sendMessage = mutation({
  args: {
    profileId: v.id('profiles'),
    senderName: v.string(),
    senderEmail: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  returns: v.id('contactMessages'),
  handler: async (ctx, args) => {
    const { profileId } = args;
    const senderName = requiredText(args.senderName, 'Name', 120);
    const senderEmail = normalizeEmail(args.senderEmail);
    const subject = requiredText(args.subject, 'Subject', 200);
    const message = requiredText(args.message, 'Message', 5000);

    const profile = await ctx.db.get(profileId);
    if (
      !profile ||
      !(await resolveEffectivePublicProfileState(ctx, profile))
    ) {
      throw new Error('Profile not found or not public');
    }

    await rateLimiter.limit(ctx, 'contactPerProfile', {
      key: profileId,
      throws: true,
    });
    await rateLimiter.limit(ctx, 'contactPerSenderProfile', {
      key: await stableRateLimitKey(
        'contact-sender-profile',
        `${profileId}:${senderEmail}`
      ),
      throws: true,
    });

    const messageId = await ctx.db.insert('contactMessages', {
      profileId,
      senderName,
      senderEmail,
      subject,
      message,
      isRead: false,
      isReplied: false,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

const messageValidator = v.object({
  _id: v.id('contactMessages'),
  _creationTime: v.number(),
  profileId: v.id('profiles'),
  senderName: v.string(),
  senderEmail: v.string(),
  subject: v.string(),
  message: v.string(),
  isRead: v.boolean(),
  isReplied: v.boolean(),
  createdAt: v.number(),
});

export const getMessages = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(messageValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { page: [], continueCursor: '', isDone: true };
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile) {
      return { page: [], continueCursor: '', isDone: true };
    }

    return await ctx.db
      .query('contactMessages')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .order('desc')
      .paginate(args.paginationOpts);
  },
});

export const getUnreadCount = query({
  args: {},
  returns: v.object({ count: v.number(), isCapped: v.boolean() }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { count: 0, isCapped: false };

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile) return { count: 0, isCapped: false };

    const unread = await ctx.db
      .query('contactMessages')
      .withIndex('by_profile_and_read', (q) =>
        q.eq('profileId', profile._id).eq('isRead', false)
      )
      .take(1001);

    return {
      count: Math.min(unread.length, 1000),
      isCapped: unread.length > 1000,
    };
  },
});

export const markAsRead = mutation({
  args: {
    messageId: v.id('contactMessages'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureAccountActive(ctx, userId);

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error('Message not found');

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile || message.profileId !== profile._id) {
      throw new Error('Not authorized');
    }

    await ctx.db.patch(args.messageId, { isRead: true });
  },
});

export const markAsReplied = mutation({
  args: {
    messageId: v.id('contactMessages'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureAccountActive(ctx, userId);

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error('Message not found');

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile || message.profileId !== profile._id) {
      throw new Error('Not authorized');
    }

    await ctx.db.patch(args.messageId, { isReplied: true, isRead: true });
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id('contactMessages'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureAccountActive(ctx, userId);

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error('Message not found');

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile || message.profileId !== profile._id) {
      throw new Error('Not authorized');
    }

    await ctx.db.delete(args.messageId);
  },
});
