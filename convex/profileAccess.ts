import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import {
  canAccessProfile,
  getProfileAccessFlags,
  isProfilePubliclyAccessible,
  isProfileGrantValid,
  resolveProfileAccessMode,
  type ProfileAccessMode,
  type ProfileAuthorization,
} from '../lib/profile/access';
import { isProfilePasscodeHash } from '../lib/profile/passcode-policy';
import { rateLimiter } from './rateLimits';
import { stableRateLimitKey } from './rateLimitKey';
import {
  removeDirectoryProjectionForProfile,
  syncDirectoryProjection,
} from './directory';
import { resolveEffectiveProfilePresentationState } from './publicProfiles';
import { toAuthorizedProfile } from './profileValidators';
import { normalizeEmail, requiredText } from './validation';
import { profileConfigureLimitIdentity } from '../lib/profile/configure-limit-policy';
import { createStorageAccessDto } from '../lib/profile/storage-policy';
import { canAccessProfileManagedMedia } from '../lib/profile/media';
import {
  applyTranslationOverlay,
  DEFAULT_PROFILE_LOCALE,
  normalizeProfileLocale,
} from '../lib/profile/locales';
import {
  normalizeUtmValue,
  safeReferrerHostname,
} from '../lib/analytics/privacy';

const GRANT_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_ACTIVE_GRANTS = 5;
const CLEANUP_LIMIT = 20;
const EXPIRED_GRANT_CLEANUP_LIMIT = 100;
const HEX_SHA256_PATTERN = /^[a-f0-9]{64}$/;
const USERNAME_PATTERN =
  /^(?:[a-z0-9_]{3,15}|[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?)$/;

const accessModeValidator = v.union(
  v.literal('private'),
  v.literal('passcode'),
  v.literal('unlisted'),
  v.literal('public')
);

const testimonialValidator = v.object({
  _id: v.id('testimonials'),
  authorName: v.string(),
  authorTitle: v.optional(v.string()),
  authorCompany: v.optional(v.string()),
  relationship: v.string(),
  content: v.string(),
  rating: v.optional(v.number()),
  createdAt: v.number(),
});

const normalizeLookupUsername = (value: string): string | null => {
  const normalized = value.toLowerCase();
  return USERNAME_PATTERN.test(normalized) ? normalized : null;
};

async function findProfileByUsername(
  ctx: QueryCtx | MutationCtx,
  username: string
): Promise<Doc<'profiles'> | null> {
  const normalized = normalizeLookupUsername(username);
  if (!normalized) return null;
  const exact = await ctx.db
    .query('profiles')
    .withIndex('by_username', (q) => q.eq('username', username))
    .unique();
  return (
    exact ??
    (await ctx.db
      .query('profiles')
      .withIndex('by_normalized_username', (q) =>
        q.eq('normalizedUsername', normalized)
      )
      .unique()) ??
    (await ctx.db
      .query('profiles')
      .withIndex('by_username', (q) => q.eq('username', normalized))
      .unique())
  );
}

const profileMode = (profile: Doc<'profiles'>): ProfileAccessMode =>
  resolveProfileAccessMode(
    profile.isPublic,
    profile.isDirectoryListed,
    profile.accessMode
  );

const profileIsBeingDeleted = async (
  ctx: QueryCtx | MutationCtx,
  profile: Doc<'profiles'>
): Promise<boolean> =>
  Boolean(
    await ctx.db
      .query('deletionJobs')
      .withIndex('by_user', (q) => q.eq('userId', profile.userId))
      .first()
  );

async function grantAuthorization(
  ctx: QueryCtx | MutationCtx,
  profile: Doc<'profiles'>,
  tokenHash?: string,
  ownerProfileId?: Id<'profiles'>
): Promise<ProfileAuthorization> {
  if (ownerProfileId === profile._id) return 'owner';
  if (!tokenHash || !HEX_SHA256_PATTERN.test(tokenHash)) return 'none';
  const grant = await ctx.db
    .query('profileAccessGrants')
    .withIndex('by_token_hash', (q) => q.eq('tokenHash', tokenHash))
    .unique();
  const accessVersion = profile.accessVersion ?? 0;
  if (
    !grant ||
    !isProfileGrantValid({
      grantProfileId: grant.profileId,
      profileId: profile._id,
      grantAccessVersion: grant.accessVersion,
      profileAccessVersion: accessVersion,
      expiresAt: grant.expiresAt,
      now: Date.now(),
      mode: profileMode(profile),
    })
  ) {
    return 'none';
  }
  return 'grant';
}

async function resolveAuthorizedProfile(
  ctx: QueryCtx | MutationCtx,
  username: string,
  tokenHash?: string,
  ownerProfileId?: Id<'profiles'>
) {
  const profile = await findProfileByUsername(ctx, username);
  if (!profile || (await profileIsBeingDeleted(ctx, profile))) return null;
  const mode = profileMode(profile);
  const authorization = await grantAuthorization(
    ctx,
    profile,
    tokenHash,
    ownerProfileId
  );
  if (!canAccessProfile(mode, authorization) || mode === 'private') return null;
  const state = await resolveEffectiveProfilePresentationState(ctx, profile);
  if (!state) return null;
  return { profile, state, mode, authorization };
}

export const getEnvelope = internalQuery({
  args: { username: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      profileId: v.id('profiles'),
      username: v.string(),
      mode: accessModeValidator,
    })
  ),
  handler: async (ctx, args) => {
    const profile = await findProfileByUsername(ctx, args.username);
    if (!profile || (await profileIsBeingDeleted(ctx, profile))) return null;
    const mode = profileMode(profile);
    if (mode === 'private') return null;
    if (!isProfilePubliclyAccessible(mode) && mode !== 'passcode') {
      return null;
    }
    if (!(await resolveEffectiveProfilePresentationState(ctx, profile))) {
      return null;
    }
    return { profileId: profile._id, username: profile.username, mode };
  },
});

export const getBundle = internalQuery({
  args: {
    username: v.string(),
    tokenHash: v.optional(v.string()),
    ownerProfileId: v.optional(v.id('profiles')),
    locale: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      profile: v.any(),
      testimonials: v.array(testimonialValidator),
      authorization: v.union(
        v.literal('none'),
        v.literal('grant'),
        v.literal('owner')
      ),
    })
  ),
  handler: async (ctx, args) => {
    const authorized = await resolveAuthorizedProfile(
      ctx,
      args.username,
      args.tokenHash,
      args.ownerProfileId
    );
    if (!authorized) return null;
    const testimonials = authorized.state.sectionsVisibility.testimonials
      ? await ctx.db
          .query('testimonials')
          .withIndex('by_profile_and_approved', (q) =>
            q.eq('profileId', authorized.profile._id).eq('isApproved', true)
          )
          .order('desc')
          .take(50)
      : [];
    const defaultLocale =
      authorized.profile.defaultLocale ?? DEFAULT_PROFILE_LOCALE;
    const locale = args.locale
      ? normalizeProfileLocale(args.locale)
      : defaultLocale;
    if (!(authorized.profile.locales ?? [defaultLocale]).includes(locale)) {
      return null;
    }
    const translation =
      locale === defaultLocale
        ? null
        : await ctx.db
            .query('profileLocales')
            .withIndex('by_profile_locale', (q) =>
              q.eq('profileId', authorized.profile._id).eq('locale', locale)
            )
            .unique();
    const localizedProfile = applyTranslationOverlay(
      authorized.profile,
      translation ? { text: translation.text, lists: translation.lists } : null
    );
    return {
      profile: {
        ...toAuthorizedProfile(localizedProfile, authorized.state),
        locale,
        defaultLocale,
        locales: authorized.profile.locales ?? [defaultLocale],
      },
      testimonials: testimonials.map((item) => ({
        _id: item._id,
        authorName: item.authorName,
        authorTitle: item.authorTitle,
        authorCompany: item.authorCompany,
        relationship: item.relationship,
        content: item.content,
        rating: item.rating,
        createdAt: item.createdAt,
      })),
      authorization: authorized.authorization,
    };
  },
});

export const authorizeProtectedPdf = internalMutation({
  args: {
    username: v.string(),
    tokenHash: v.optional(v.string()),
    ownerProfileId: v.optional(v.id('profiles')),
  },
  returns: v.union(
    v.null(),
    v.object({
      profileId: v.id('profiles'),
      username: v.string(),
      authorization: v.union(v.literal('grant'), v.literal('owner')),
    })
  ),
  handler: async (ctx, args) => {
    const authorized = await resolveAuthorizedProfile(
      ctx,
      args.username,
      args.tokenHash,
      args.ownerProfileId
    );
    if (
      !authorized ||
      authorized.mode !== 'passcode' ||
      authorized.authorization === 'none'
    ) {
      return null;
    }
    await rateLimiter.limit(ctx, 'pdfPerProfile', {
      key: authorized.profile._id,
      throws: true,
    });
    return {
      profileId: authorized.profile._id,
      username: authorized.profile.username,
      authorization: authorized.authorization,
    };
  },
});

export const beginUnlock = internalMutation({
  args: { username: v.string(), callerHash: v.string() },
  returns: v.object({
    profileId: v.optional(v.id('profiles')),
    accessVersion: v.number(),
    encodedHash: v.optional(v.string()),
    eligible: v.boolean(),
  }),
  handler: async (ctx, args) => {
    if (!HEX_SHA256_PATTERN.test(args.callerHash))
      throw new Error('Invalid request');
    const normalized = normalizeLookupUsername(args.username) ?? 'invalid';
    await rateLimiter.limit(ctx, 'passcodeUnlockGlobal', {
      key: 'global',
      throws: true,
    });
    await rateLimiter.limit(ctx, 'passcodeUnlockPerCallerProfile', {
      key: await stableRateLimitKey(
        'passcode-caller-profile',
        `${args.callerHash}:${normalized}`
      ),
      throws: true,
    });
    const profile = await findProfileByUsername(ctx, args.username);
    if (!profile || (await profileIsBeingDeleted(ctx, profile))) {
      return { accessVersion: 0, eligible: false };
    }
    await rateLimiter.limit(ctx, 'passcodeUnlockPerProfile', {
      key: profile._id,
      throws: true,
    });
    const passcode = await ctx.db
      .query('profilePasscodes')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .unique();
    const eligible = profileMode(profile) === 'passcode' && Boolean(passcode);
    return {
      profileId: profile._id,
      accessVersion: profile.accessVersion ?? 0,
      encodedHash: passcode?.encodedHash,
      eligible,
    };
  },
});

const randomToken = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
};

export const issueGrant = internalMutation({
  args: { profileId: v.id('profiles'), accessVersion: v.number() },
  returns: v.union(
    v.null(),
    v.object({ token: v.string(), username: v.string(), expiresAt: v.number() })
  ),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (
      !profile ||
      (await profileIsBeingDeleted(ctx, profile)) ||
      profileMode(profile) !== 'passcode' ||
      (profile.accessVersion ?? 0) !== args.accessVersion
    ) {
      return null;
    }
    const passcode = await ctx.db
      .query('profilePasscodes')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .unique();
    if (!passcode) return null;
    const now = Date.now();
    const expired = await ctx.db
      .query('profileAccessGrants')
      .withIndex('by_expiration', (q) => q.lt('expiresAt', now))
      .take(CLEANUP_LIMIT);
    for (const grant of expired) await ctx.db.delete(grant._id);
    const active = await ctx.db
      .query('profileAccessGrants')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .order('asc')
      .take(MAX_ACTIVE_GRANTS);
    while (active.length >= MAX_ACTIVE_GRANTS) {
      const oldest = active.shift();
      if (oldest) await ctx.db.delete(oldest._id);
    }
    const token = randomToken();
    const expiresAt = now + GRANT_TTL_MS;
    await ctx.db.insert('profileAccessGrants', {
      profileId: profile._id,
      tokenHash: await sha256Hex(token),
      accessVersion: args.accessVersion,
      createdAt: now,
      expiresAt,
    });
    return { token, username: profile.username, expiresAt };
  },
});

export const cleanupExpiredGrants = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const expired = await ctx.db
      .query('profileAccessGrants')
      .withIndex('by_expiration', (q) => q.lt('expiresAt', Date.now()))
      .order('asc')
      .take(EXPIRED_GRANT_CLEANUP_LIMIT);
    for (const grant of expired) await ctx.db.delete(grant._id);
    return expired.length;
  },
});

async function deletePasscodes(ctx: MutationCtx, profileId: Id<'profiles'>) {
  const passcodes = await ctx.db
    .query('profilePasscodes')
    .withIndex('by_profile', (q) => q.eq('profileId', profileId))
    .take(2);
  for (const passcode of passcodes) await ctx.db.delete(passcode._id);
}

export const configure = internalMutation({
  args: {
    profileId: v.id('profiles'),
    mode: accessModeValidator,
    encodedHash: v.optional(v.string()),
  },
  returns: v.object({ mode: accessModeValidator, accessVersion: v.number() }),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile || (await profileIsBeingDeleted(ctx, profile))) {
      throw new Error('Invalid request');
    }
    if (args.mode === 'passcode' && !isProfilePasscodeHash(args.encodedHash)) {
      throw new Error('Invalid request');
    }
    const now = Date.now();
    await deletePasscodes(ctx, profile._id);
    if (args.mode === 'passcode') {
      await ctx.db.insert('profilePasscodes', {
        profileId: profile._id,
        encodedHash: args.encodedHash!,
        createdAt: now,
        updatedAt: now,
      });
    }
    const accessVersion = (profile.accessVersion ?? 0) + 1;
    const flags = getProfileAccessFlags(args.mode);
    await ctx.db.patch(profile._id, {
      accessMode: args.mode,
      accessVersion,
      ...flags,
    });
    await removeDirectoryProjectionForProfile(ctx, profile);
    const updated = await ctx.db.get(profile._id);
    if (updated && args.mode === 'public')
      await syncDirectoryProjection(ctx, updated);
    return { mode: args.mode, accessVersion };
  },
});

export const prepareConfigure = internalMutation({
  args: { profileId: v.id('profiles') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile || (await profileIsBeingDeleted(ctx, profile))) {
      throw new Error('Invalid request');
    }
    await rateLimiter.limit(ctx, 'profileConfigureGlobal', {
      key: 'global',
      throws: true,
    });
    await rateLimiter.limit(ctx, 'profileConfigurePerUserProfile', {
      key: await stableRateLimitKey(
        'profile-configure',
        profileConfigureLimitIdentity(profile.userId, profile._id)
      ),
      throws: true,
    });
    return null;
  },
});

export const revokeGrants = internalMutation({
  args: { profileId: v.id('profiles') },
  returns: v.number(),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile || (await profileIsBeingDeleted(ctx, profile))) {
      throw new Error('Invalid request');
    }
    const accessVersion = (profile.accessVersion ?? 0) + 1;
    await ctx.db.patch(profile._id, { accessVersion });
    const grants = await ctx.db
      .query('profileAccessGrants')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .take(CLEANUP_LIMIT);
    for (const grant of grants) await ctx.db.delete(grant._id);
    return accessVersion;
  },
});

const protectedStorageAccess = async (
  ctx: QueryCtx,
  args: {
    username: string;
    storageId: Id<'_storage'>;
    tokenHash?: string;
    ownerProfileId?: Id<'profiles'>;
  }
) => {
  const authorized = await resolveAuthorizedProfile(
    ctx,
    args.username,
    args.tokenHash,
    args.ownerProfileId
  );
  if (!authorized) return null;
  if (
    !canAccessProfileManagedMedia(authorized.profile, args.storageId, {
      accessMode: authorized.mode,
      authorization: authorized.authorization,
      sectionsVisibility: authorized.state.sectionsVisibility,
    })
  )
    return null;
  const upload = await ctx.db
    .query('uploadedFiles')
    .withIndex('by_storage', (q) => q.eq('storageId', args.storageId))
    .unique();
  if (!upload || upload.profileId !== authorized.profile._id) return null;
  return createStorageAccessDto(upload);
};

export const getProtectedStorageAccess = internalQuery({
  args: {
    username: v.string(),
    storageId: v.id('_storage'),
    tokenHash: v.optional(v.string()),
    ownerProfileId: v.optional(v.id('profiles')),
  },
  returns: v.union(
    v.null(),
    v.object({
      storageId: v.id('_storage'),
      contentType: v.string(),
      size: v.number(),
    })
  ),
  handler: async (ctx, args) => await protectedStorageAccess(ctx, args),
});

export const resolveProtectedStorageUrl = internalQuery({
  args: {
    username: v.string(),
    storageId: v.id('_storage'),
    tokenHash: v.optional(v.string()),
    ownerProfileId: v.optional(v.id('profiles')),
  },
  returns: v.union(
    v.null(),
    v.object({ url: v.string(), contentType: v.string(), size: v.number() })
  ),
  handler: async (ctx, args) => {
    const access = await protectedStorageAccess(ctx, args);
    if (!access) return null;
    const url = await ctx.storage.getUrl(args.storageId);
    return url
      ? { url, contentType: access.contentType, size: access.size }
      : null;
  },
});

export const sendProtectedMessage = internalMutation({
  args: {
    username: v.string(),
    tokenHash: v.string(),
    senderName: v.string(),
    senderEmail: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const authorized = await resolveAuthorizedProfile(
      ctx,
      args.username,
      args.tokenHash
    );
    if (!authorized || authorized.mode !== 'passcode') return false;
    const senderName = requiredText(args.senderName, 'Name', 120);
    const senderEmail = normalizeEmail(args.senderEmail);
    const subject = requiredText(args.subject, 'Subject', 200);
    const message = requiredText(args.message, 'Message', 5000);
    await rateLimiter.limit(ctx, 'contactPerProfile', {
      key: authorized.profile._id,
      throws: true,
    });
    await rateLimiter.limit(ctx, 'contactPerSenderProfile', {
      key: await stableRateLimitKey(
        'contact-sender-profile',
        `${authorized.profile._id}:${senderEmail}`
      ),
      throws: true,
    });
    await ctx.db.insert('contactMessages', {
      profileId: authorized.profile._id,
      senderName,
      senderEmail,
      subject,
      message,
      isRead: false,
      isReplied: false,
      createdAt: Date.now(),
    });
    return true;
  },
});

export const recordProtectedEvent = internalMutation({
  args: {
    username: v.string(),
    tokenHash: v.string(),
    eventType: v.union(v.literal('view'), v.literal('pdf_download')),
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
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (
      (args.referrer !== undefined &&
        safeReferrerHostname(`https://${args.referrer}`) !== args.referrer) ||
      (args.countryCode !== undefined &&
        !/^[A-Z]{2}$/.test(args.countryCode)) ||
      [args.utmSource, args.utmMedium, args.utmCampaign].some(
        (value) => normalizeUtmValue(value) !== value
      )
    ) {
      throw new Error('Invalid analytics metadata');
    }
    const authorized = await resolveAuthorizedProfile(
      ctx,
      args.username,
      args.tokenHash
    );
    if (
      !authorized ||
      authorized.mode !== 'passcode' ||
      authorized.profile.analyticsEnabled === false
    ) {
      return false;
    }
    await rateLimiter.limit(ctx, 'analyticsEvent', {
      key: authorized.profile._id,
      throws: true,
    });
    await ctx.db.insert('profileAnalytics', {
      profileId: authorized.profile._id,
      eventType: args.eventType,
      ...(args.referrer ? { referrer: args.referrer } : {}),
      countryCode: args.countryCode,
      deviceCategory: args.deviceCategory,
      utmSource: args.utmSource,
      utmMedium: args.utmMedium,
      utmCampaign: args.utmCampaign,
      createdAt: Date.now(),
    });
    return true;
  },
});
