import { getAuthUserId } from '@convex-dev/auth/server';
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import type { Id } from './_generated/dataModel';
import { v } from 'convex/values';
import { nanoid } from 'nanoid';
import { rateLimiter } from './rateLimits';
import { PUBLIC_PROFILE_USERNAME_PATTERN } from './profileValidators';
import { resolveEffectivePublicProfileState } from './publicProfiles';
import { ensureAccountActive } from './deletion';
import {
  MAX_PROJECT_IMAGE_SIZE_BYTES,
  normalizeSafeRasterContentType,
} from '../lib/profile/raster-image-policy';
import {
  createStorageAccessDto,
  evaluateUploadAbortPolicy,
  evaluateUploadReservationCompletion,
  isCompletedUploadRetry,
  isPreviewTokenEligible,
  UPLOAD_SESSION_TTL_MS,
} from '../lib/profile/storage-policy';
import {
  canAccessProfileManagedMedia,
  findManagedMediaReference,
  managedMediaStorageIds,
} from '../lib/profile/media';
import { resolveProfileAccessMode } from '../lib/profile/access';

const UPLOAD_CLEANUP_BATCH_SIZE = 100;
const UPLOAD_SESSION_CLEANUP_BATCH_SIZE = 25;
const UPLOAD_TOKEN_PATTERN = /^[A-Za-z0-9_-]{48}$/;

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
  const referencedImages = profile
    ? managedMediaStorageIds(profile)
    : new Set<string>();
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
    if (!referencedImages.has(upload.storageId)) {
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

const sessionStoragePolicyInput = async (
  ctx: MutationCtx,
  session: {
    userId: Id<'users'>;
    profileId?: Id<'profiles'>;
    expectedContentType?: string;
    expectedSize?: number;
    createdAt?: number;
    expiresAt: number;
    storageId?: Id<'_storage'>;
    state?: string;
  },
  storageId: Id<'_storage'>
) => {
  const [profile, metadata, existing] = await Promise.all([
    session.profileId ? ctx.db.get(session.profileId) : null,
    ctx.db.system.get(storageId),
    ctx.db
      .query('uploadedFiles')
      .withIndex('by_storage', (q) => q.eq('storageId', storageId))
      .unique(),
  ]);
  return {
    profile,
    metadata,
    existing,
    input: metadata
      ? {
          sessionUserId: session.userId,
          profileUserId: profile?.userId,
          expectedContentType: session.expectedContentType,
          expectedSize: session.expectedSize,
          sessionCreatedAt: session.createdAt,
          sessionExpiresAt: session.expiresAt,
          recordedStorageId: session.storageId,
          storageId,
          storageCreationTime: metadata._creationTime,
          storageContentType: metadata.contentType,
          storageSize: metadata.size,
          alreadyTracked: Boolean(existing),
          sessionState: session.state,
        }
      : null,
  };
};

const cleanupExpiredReservations = async (ctx: MutationCtx): Promise<number> => {
  const now = Date.now();
  const sessions = await ctx.db
    .query('uploadSessions')
    .withIndex('by_expiration', (q) => q.lt('expiresAt', now))
    .take(UPLOAD_SESSION_CLEANUP_BATCH_SIZE);
  for (const session of sessions) {
    if (session.storageId && session.state !== 'completed') {
      const storage = await sessionStoragePolicyInput(
        ctx,
        session,
        session.storageId
      );
      if (
        storage.input &&
        evaluateUploadAbortPolicy(storage.input).shouldDelete
      ) {
        await ctx.storage.delete(session.storageId);
      }
    }
    await ctx.db.delete(session._id);
  }
  return sessions.length;
};

export const reserveImageUpload = internalMutation({
  args: {
    profileId: v.id('profiles'),
    expectedContentType: v.string(),
    expectedSize: v.number(),
  },
  returns: v.object({ uploadUrl: v.string(), uploadToken: v.string() }),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error('Profile not found');
    await ensureAccountActive(ctx, profile.userId);
    const expectedContentType = normalizeSafeRasterContentType(
      args.expectedContentType
    );
    if (
      !expectedContentType ||
      !Number.isSafeInteger(args.expectedSize) ||
      args.expectedSize <= 0 ||
      args.expectedSize > MAX_PROJECT_IMAGE_SIZE_BYTES
    ) {
      throw new Error('Invalid image');
    }
    await rateLimiter.limit(ctx, 'uploadSessionPerUser', {
      key: profile.userId,
      throws: true,
    });
    await cleanupUserUploads(ctx, profile.userId);
    await cleanupExpiredReservations(ctx);

    const uploadToken = nanoid(48);
    const createdAt = Date.now();
    await ctx.db.insert('uploadSessions', {
      token: uploadToken,
      userId: profile.userId,
      profileId: profile._id,
      expectedContentType,
      expectedSize: args.expectedSize,
      state: 'reserved',
      createdAt,
      expiresAt: createdAt + UPLOAD_SESSION_TTL_MS,
    });
    return { uploadUrl: await ctx.storage.generateUploadUrl(), uploadToken };
  },
});

export const completeImageUpload = internalMutation({
  args: { storageId: v.id('_storage'), uploadToken: v.string() },
  returns: v.union(
    v.object({ status: v.literal('success'), previewToken: v.string() }),
    v.object({ status: v.literal('rejected') })
  ),
  handler: async (ctx, args) => {
    if (!UPLOAD_TOKEN_PATTERN.test(args.uploadToken)) {
      return { status: 'rejected' as const };
    }
    const session = await ctx.db
      .query('uploadSessions')
      .withIndex('by_token', (q) => q.eq('token', args.uploadToken))
      .unique();
    if (!session?.profileId) return { status: 'rejected' as const };
    const storage = await sessionStoragePolicyInput(ctx, session, args.storageId);
    if (!storage.profile || storage.profile.userId !== session.userId) {
      return { status: 'rejected' as const };
    }
    await ensureAccountActive(ctx, session.userId);

    if (
      session.previewToken &&
      isCompletedUploadRetry({
        sessionState: session.state,
        recordedStorageId: session.storageId,
        requestedStorageId: args.storageId,
        sessionUserId: session.userId,
        trackedUserId: storage.existing?.userId,
      })
    ) {
      return { status: 'success' as const, previewToken: session.previewToken };
    }
    if (!storage.input) return { status: 'rejected' as const };
    const policy = evaluateUploadReservationCompletion({
      ...storage.input,
      now: Date.now(),
    });
    if (policy.safelyMatchedUntracked) {
      await ctx.db.patch(session._id, {
        storageId: args.storageId,
        state: 'uploaded',
      });
    }
    if (!policy.eligible || !policy.contentType) {
      return { status: 'rejected' as const };
    }

    const previewToken = createPreviewToken();
    await ctx.db.insert('uploadedFiles', {
      storageId: args.storageId,
      userId: session.userId,
      previewToken,
      contentType: policy.contentType,
      size: storage.metadata!.size,
      createdAt: Date.now(),
    });
    await ctx.db.patch(session._id, {
      storageId: args.storageId,
      previewToken,
      state: 'completed',
      completedAt: Date.now(),
    });
    return { status: 'success' as const, previewToken };
  },
});

export const abortImageUpload = internalMutation({
  args: {
    uploadToken: v.string(),
    storageId: v.optional(v.id('_storage')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!UPLOAD_TOKEN_PATTERN.test(args.uploadToken)) return null;
    const session = await ctx.db
      .query('uploadSessions')
      .withIndex('by_token', (q) => q.eq('token', args.uploadToken))
      .unique();
    if (!session || session.state === 'completed') return null;
    const storageId = args.storageId ?? session.storageId;
    if (storageId) {
      const storage = await sessionStoragePolicyInput(ctx, session, storageId);
      if (
        storage.input &&
        evaluateUploadAbortPolicy(storage.input).shouldDelete
      ) {
        await ctx.storage.delete(storageId);
        await ctx.db.patch(session._id, { storageId, state: 'aborted' });
        return null;
      }
    }
    if (!session.storageId) await ctx.db.patch(session._id, { state: 'aborted' });
    return null;
  },
});

export const cleanupExpiredUploadSessions = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => await cleanupExpiredReservations(ctx),
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
    if (profile && findManagedMediaReference(profile, args.storageId)) {
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

const storageAccessValidator = v.object({
  storageId: v.id('_storage'),
  contentType: v.string(),
  size: v.number(),
});

const resolveImageAccess = async (
  ctx: QueryCtx,
  args: {
    storageId: Id<'_storage'>;
    previewToken?: string;
    profileUsername?: string;
    ownerProfileId?: Id<'profiles'>;
  }
) => {
  const upload = await ctx.db
    .query('uploadedFiles')
    .withIndex('by_storage', (q) => q.eq('storageId', args.storageId))
    .unique();
  if (!upload) return null;
  const deletionJob = await ctx.db
    .query('deletionJobs')
    .withIndex('by_user', (q) => q.eq('userId', upload.userId))
    .first();
  if (deletionJob) return null;

  if (
    isPreviewTokenEligible({
      profileId: upload.profileId,
      storedPreviewToken: upload.previewToken,
      suppliedPreviewToken: args.previewToken,
    })
  ) {
    return createStorageAccessDto(upload);
  }

  if (args.ownerProfileId) {
    const ownerProfile = await ctx.db.get(args.ownerProfileId);
    if (
      ownerProfile &&
      upload.userId === ownerProfile.userId &&
      upload.profileId === ownerProfile._id &&
      findManagedMediaReference(ownerProfile, args.storageId)
    ) {
      return createStorageAccessDto(upload);
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
    const accessMode = publicProfile
      ? resolveProfileAccessMode(
          publicProfile.isPublic,
          publicProfile.isDirectoryListed,
          publicProfile.accessMode
        )
      : 'private';
    if (
      publicProfile &&
      state &&
      upload.userId === publicProfile.userId &&
      upload.profileId === publicProfile._id &&
      canAccessProfileManagedMedia(publicProfile, args.storageId, {
        accessMode,
        authorization: 'none',
        sectionsVisibility: state.sectionsVisibility,
      })
    ) {
      return createStorageAccessDto(upload);
    }
  }

  return null;
};

export const getImageAccess = query({
  args: {
    storageId: v.id('_storage'),
    previewToken: v.optional(v.string()),
    profileUsername: v.optional(v.string()),
  },
  returns: v.union(v.null(), storageAccessValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const ownerProfile = userId
      ? await ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', userId))
          .unique()
      : null;
    return await resolveImageAccess(ctx, {
      ...args,
      ownerProfileId: ownerProfile?._id,
    });
  },
});

export const resolveImageStorageUrl = internalQuery({
  args: {
    storageId: v.id('_storage'),
    previewToken: v.optional(v.string()),
    profileUsername: v.optional(v.string()),
    ownerProfileId: v.optional(v.id('profiles')),
  },
  returns: v.union(
    v.null(),
    v.object({ url: v.string(), contentType: v.string(), size: v.number() })
  ),
  handler: async (ctx, args) => {
    const access = await resolveImageAccess(ctx, args);
    if (!access) return null;
    const url = await ctx.storage.getUrl(args.storageId);
    return url ? { url, contentType: access.contentType, size: access.size } : null;
  },
});
