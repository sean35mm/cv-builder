import { getAuthUserId } from '@convex-dev/auth/server';
import { mutation, query, type MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { v } from 'convex/values';
import { nanoid } from 'nanoid';
import { rateLimiter } from './rateLimits';
import { PUBLIC_PROFILE_USERNAME_PATTERN } from './profileValidators';
import { resolveEffectivePublicProfileState } from './publicProfiles';
import { ensureAccountActive } from './deletion';

const PREVIEW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{48}$/;
const UPLOAD_SESSION_TTL_MS = 15 * 60 * 1000;
const UPLOAD_CLOCK_TOLERANCE_MS = 5 * 1000;
const UPLOAD_CLEANUP_BATCH_SIZE = 100;

const createPreviewToken = (): string => nanoid(48);

const cleanupUserUploads = async (
  ctx: MutationCtx,
  userId: Id<'users'>,
  cursor?: string
): Promise<{ deleted: number; hasMore: boolean; cursor: string | null }> => {
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique();
  const referencedImages = new Set<string>(
    (profile?.projects ?? []).flatMap((project) => project.images ?? [])
  );
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const uploads = await ctx.db
    .query('uploadedFiles')
    .withIndex('by_user_and_created', (q) =>
      q.eq('userId', userId).lt('createdAt', cutoff)
    )
    .order('asc')
    .paginate({ cursor: cursor ?? null, numItems: UPLOAD_CLEANUP_BATCH_SIZE });

  let deleted = 0;
  for (const upload of uploads.page) {
    if (!referencedImages.has(`/api/storage/${upload.storageId}`)) {
      await ctx.storage.delete(upload.storageId);
      await ctx.db.delete(upload._id);
      deleted += 1;
    }
  }
  return {
    deleted,
    hasMore: !uploads.isDone,
    cursor: uploads.isDone ? null : uploads.continueCursor,
  };
};

export const generateUploadUrl = mutation({
  args: {},
  returns: v.object({ uploadUrl: v.string(), uploadToken: v.string() }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }
    await ensureAccountActive(ctx, userId);

    await rateLimiter.limit(ctx, 'uploadSessionPerUser', {
      key: userId,
      throws: true,
    });

    await cleanupUserUploads(ctx, userId);
    const expiredSessions = await ctx.db
      .query('uploadSessions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(20);
    for (const session of expiredSessions) {
      if (session.expiresAt < Date.now()) await ctx.db.delete(session._id);
    }

    const uploadToken = nanoid(32);
    const createdAt = Date.now();
    await ctx.db.insert('uploadSessions', {
      token: uploadToken,
      userId,
      createdAt,
      expiresAt: createdAt + UPLOAD_SESSION_TTL_MS,
    });
    return {
      uploadUrl: await ctx.storage.generateUploadUrl(),
      uploadToken,
    };
  },
});

export const finalizeImageUpload = mutation({
  args: { storageId: v.id('_storage'), uploadToken: v.string() },
  returns: v.union(
    v.object({ status: v.literal('success'), previewToken: v.string() }),
    v.object({ status: v.literal('rejected') })
  ),
  handler: async (ctx, args) => {
    if (!/^[A-Za-z0-9_-]{32}$/.test(args.uploadToken)) {
      throw new Error('Upload session is invalid or expired');
    }
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureAccountActive(ctx, userId);

    const session = await ctx.db
      .query('uploadSessions')
      .withIndex('by_token', (q) => q.eq('token', args.uploadToken))
      .unique();
    if (
      !session ||
      session.userId !== userId ||
      session.expiresAt < Date.now()
    ) {
      throw new Error('Upload session is invalid or expired');
    }

    await rateLimiter.limit(ctx, 'uploadFinalizationPerUser', {
      key: userId,
      throws: true,
    });

    const metadata = await ctx.db.system.get(args.storageId);
    if (!metadata) throw new Error('Upload not found');

    const sessionCreatedAt =
      session.createdAt ?? session.expiresAt - UPLOAD_SESSION_TTL_MS;
    if (
      !Number.isFinite(sessionCreatedAt) ||
      sessionCreatedAt > session.expiresAt ||
      metadata._creationTime < sessionCreatedAt - UPLOAD_CLOCK_TOLERANCE_MS ||
      metadata._creationTime > session.expiresAt + UPLOAD_CLOCK_TOLERANCE_MS
    ) {
      throw new Error('Upload does not belong to this session');
    }

    if (
      !metadata.contentType?.startsWith('image/') ||
      metadata.size > 5 * 1024 * 1024
    ) {
      await ctx.storage.delete(args.storageId);
      await ctx.db.delete(session._id);
      return { status: 'rejected' as const };
    }

    const existing = await ctx.db
      .query('uploadedFiles')
      .withIndex('by_storage', (q) => q.eq('storageId', args.storageId))
      .unique();
    if (existing) {
      if (existing.userId !== userId) throw new Error('Not authorized');
      const previewToken =
        existing.previewToken &&
        PREVIEW_TOKEN_PATTERN.test(existing.previewToken)
          ? existing.previewToken
          : createPreviewToken();
      if (previewToken !== existing.previewToken) {
        await ctx.db.patch(existing._id, { previewToken });
      }
      await ctx.db.delete(session._id);
      return { status: 'success' as const, previewToken };
    }

    const previewToken = createPreviewToken();
    await ctx.db.insert('uploadedFiles', {
      storageId: args.storageId,
      userId,
      previewToken,
      contentType: metadata.contentType,
      size: metadata.size,
      createdAt: Date.now(),
    });
    await ctx.db.delete(session._id);
    return { status: 'success' as const, previewToken };
  },
});

export const deleteImage = mutation({
  args: { storageId: v.id('_storage') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureAccountActive(ctx, userId);

    const upload = await ctx.db
      .query('uploadedFiles')
      .withIndex('by_storage', (q) => q.eq('storageId', args.storageId))
      .unique();
    if (!upload || upload.userId !== userId) throw new Error('Not authorized');

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    const imageUrl = `/api/storage/${args.storageId}`;
    if (
      profile?.projects?.some((project) => project.images?.includes(imageUrl))
    ) {
      throw new Error('Cannot delete an image referenced by the saved profile');
    }

    await ctx.storage.delete(args.storageId);
    await ctx.db.delete(upload._id);
    return null;
  },
});

export const cleanupUnreferencedImages = mutation({
  args: { cursor: v.optional(v.string()) },
  returns: v.object({
    deleted: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureAccountActive(ctx, userId);

    return await cleanupUserUploads(ctx, userId, args.cursor);
  },
});

export const getImageUrl = query({
  args: {
    storageId: v.id('_storage'),
    previewToken: v.optional(v.string()),
    profileUsername: v.optional(v.string()),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const upload = await ctx.db
      .query('uploadedFiles')
      .withIndex('by_storage', (q) => q.eq('storageId', args.storageId))
      .unique();

    if (
      upload &&
      args.previewToken &&
      PREVIEW_TOKEN_PATTERN.test(args.previewToken) &&
      upload.previewToken === args.previewToken
    ) {
      return await ctx.storage.getUrl(args.storageId);
    }

    const userId = await getAuthUserId(ctx);
    const canonicalUrl = `/api/storage/${args.storageId}`;
    if (userId) {
      const ownerProfile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .unique();
      if (
        ownerProfile?.projects?.some((project) =>
          project.images?.includes(canonicalUrl)
        )
      ) {
        return await ctx.storage.getUrl(args.storageId);
      }
    }

    const profileUsername = args.profileUsername;
    if (
      profileUsername &&
      PUBLIC_PROFILE_USERNAME_PATTERN.test(profileUsername)
    ) {
      const exactPublicProfile = await ctx.db
        .query('profiles')
        .withIndex('by_username', (q) => q.eq('username', profileUsername))
        .unique();
      const publicProfile =
        exactPublicProfile ??
        (await ctx.db
          .query('profiles')
          .withIndex('by_normalized_username', (q) =>
            q.eq('normalizedUsername', profileUsername.toLowerCase())
          )
          .unique());
      const state = publicProfile
        ? await resolveEffectivePublicProfileState(ctx, publicProfile)
        : null;
      if (
        state?.sectionsVisibility.projects &&
        publicProfile?.projects?.some((project) =>
          project.images?.includes(canonicalUrl)
        )
      ) {
        return await ctx.storage.getUrl(args.storageId);
      }
    }

    return null;
  },
});
