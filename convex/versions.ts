import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import {
  normalizeSectionsOrder,
  normalizeSectionsVisibility,
  requiredText,
} from './validation';
import { ensureAccountActive } from './deletion';
import { syncDirectoryProjection } from './directory';

export const getDefaultVersionForProfile = query({
  args: {
    profileId: v.id('profiles'),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id('resumeVersions'),
      name: v.string(),
      sectionsVisibility: v.record(v.string(), v.boolean()),
      sectionsOrder: v.optional(v.array(v.string())),
    })
  ),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile?.isPublic || !profile.defaultVersionId) return null;

    const version = await ctx.db.get(profile.defaultVersionId);

    if (!version || version.profileId !== profile._id) return null;

    return {
      _id: version._id,
      name: version.name,
      sectionsVisibility: version.sectionsVisibility,
      sectionsOrder: version.sectionsOrder,
    };
  },
});

export const getVersions = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('resumeVersions'),
      name: v.string(),
      isDefault: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
      sectionsVisibility: v.record(v.string(), v.boolean()),
      sectionsOrder: v.optional(v.array(v.string())),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (!profile) return [];

    const versions = await ctx.db
      .query('resumeVersions')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .take(25);

    return versions.map((v) => ({
      _id: v._id,
      name: v.name,
      isDefault: profile.defaultVersionId === v._id,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      sectionsVisibility: v.sectionsVisibility,
      sectionsOrder: v.sectionsOrder,
    }));
  },
});

export const createVersion = mutation({
  args: {
    name: v.string(),
    sectionsVisibility: v.record(v.string(), v.boolean()),
    sectionsOrder: v.optional(v.array(v.string())),
    makeDefault: v.optional(v.boolean()),
  },
  returns: v.id('resumeVersions'),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureAccountActive(ctx, userId);

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (!profile) throw new Error('Profile not found');

    const now = Date.now();
    const name = requiredText(args.name, 'Version name', 120);
    const sectionsOrder = normalizeSectionsOrder(args.sectionsOrder);
    const existingVersions = await ctx.db
      .query('resumeVersions')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .take(25);
    if (existingVersions.length >= 25) {
      throw new Error('Resume version limit reached');
    }

    if (args.makeDefault && profile.defaultVersionId) {
      const previousDefault = await ctx.db.get(profile.defaultVersionId);
      if (
        previousDefault?.profileId === profile._id &&
        previousDefault.isDefault
      ) {
        await ctx.db.patch(previousDefault._id, {
          isDefault: false,
          updatedAt: now,
        });
      }
    }

    const versionId = await ctx.db.insert('resumeVersions', {
      profileId: profile._id,
      name,
      isDefault: args.makeDefault ?? false,
      sectionsVisibility: normalizeSectionsVisibility(args.sectionsVisibility),
      sectionsOrder,
      createdAt: now,
      updatedAt: now,
    });

    if (args.makeDefault) {
      await ctx.db.patch(profile._id, { defaultVersionId: versionId });
    }

    const updatedProfile = await ctx.db.get(profile._id);
    if (updatedProfile) await syncDirectoryProjection(ctx, updatedProfile);

    return versionId;
  },
});

export const setDefaultVersion = mutation({
  args: {
    versionId: v.id('resumeVersions'),
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

    const version = await ctx.db.get(args.versionId);
    if (!version || version.profileId !== profile._id) {
      throw new Error('Version not found');
    }

    const now = Date.now();
    if (
      profile.defaultVersionId &&
      profile.defaultVersionId !== args.versionId
    ) {
      const previousDefault = await ctx.db.get(profile.defaultVersionId);
      if (
        previousDefault?.profileId === profile._id &&
        previousDefault.isDefault
      ) {
        await ctx.db.patch(previousDefault._id, {
          isDefault: false,
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(args.versionId, {
      isDefault: true,
      updatedAt: now,
    });
    await ctx.db.patch(profile._id, { defaultVersionId: args.versionId });

    const updatedProfile = await ctx.db.get(profile._id);
    if (updatedProfile) await syncDirectoryProjection(ctx, updatedProfile);

    return null;
  },
});

export const clearDefaultVersion = mutation({
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

    if (profile.defaultVersionId) {
      const previousDefault = await ctx.db.get(profile.defaultVersionId);
      if (
        previousDefault?.profileId === profile._id &&
        previousDefault.isDefault
      ) {
        await ctx.db.patch(previousDefault._id, {
          isDefault: false,
          updatedAt: Date.now(),
        });
      }
      await ctx.db.patch(profile._id, { defaultVersionId: undefined });
    }

    const updatedProfile = await ctx.db.get(profile._id);
    if (updatedProfile) await syncDirectoryProjection(ctx, updatedProfile);

    return null;
  },
});

export const deleteVersion = mutation({
  args: {
    versionId: v.id('resumeVersions'),
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

    const version = await ctx.db.get(args.versionId);
    if (!version || version.profileId !== profile._id) {
      throw new Error('Version not found');
    }

    if (profile.defaultVersionId === args.versionId) {
      await ctx.db.patch(profile._id, { defaultVersionId: undefined });
    }

    await ctx.db.delete(args.versionId);

    const updatedProfile = await ctx.db.get(profile._id);
    if (updatedProfile) await syncDirectoryProjection(ctx, updatedProfile);

    return null;
  },
});

export const updateVersion = mutation({
  args: {
    versionId: v.id('resumeVersions'),
    name: v.optional(v.string()),
    sectionsVisibility: v.optional(v.record(v.string(), v.boolean())),
    sectionsOrder: v.optional(v.array(v.string())),
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

    const version = await ctx.db.get(args.versionId);
    if (!version || version.profileId !== profile._id) {
      throw new Error('Version not found');
    }

    const updates: {
      name?: string;
      sectionsVisibility?: Record<string, boolean>;
      sectionsOrder?: string[];
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (args.name !== undefined)
      updates.name = requiredText(args.name, 'Version name', 120);
    if (args.sectionsVisibility !== undefined)
      updates.sectionsVisibility = normalizeSectionsVisibility(
        args.sectionsVisibility
      );
    if (args.sectionsOrder !== undefined)
      updates.sectionsOrder = normalizeSectionsOrder(args.sectionsOrder)!;

    await ctx.db.patch(args.versionId, updates);

    const updatedProfile = await ctx.db.get(profile._id);
    if (updatedProfile) await syncDirectoryProjection(ctx, updatedProfile);

    return null;
  },
});
