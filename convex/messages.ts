import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

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
    const { profileId, senderName, senderEmail, subject, message } = args;

    const profile = await ctx.db.get(profileId);
    if (!profile || !profile.isPublic) {
      throw new Error('Profile not found or not public');
    }

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

export const getMessages = query({
  args: {},
  returns: v.array(
    v.object({
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

    const messages = await ctx.db
      .query('contactMessages')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .order('desc')
      .take(100);

    return messages;
  },
});

export const getUnreadCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile) return 0;

    const unread = await ctx.db
      .query('contactMessages')
      .withIndex('by_profile_and_read', (q) =>
        q.eq('profileId', profile._id).eq('isRead', false)
      )
      .collect();

    return unread.length;
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
