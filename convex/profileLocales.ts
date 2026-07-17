import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import type { Doc } from './_generated/dataModel';
import {
  applyTranslationOverlay,
  DEFAULT_PROFILE_LOCALE,
  normalizeProfileLocale,
  normalizeProfileLocales,
  normalizeTranslationOverlay,
} from '../lib/profile/locales';
import { resolveEffectivePublicProfileState } from './publicProfiles';
import { toPublicProfile } from './profileValidators';

const overlayValidator = v.object({
  text: v.record(v.string(), v.string()),
  lists: v.record(v.string(), v.array(v.string())),
});

const ownerProfile = async (
  ctx: QueryCtx | MutationCtx
): Promise<Doc<'profiles'>> => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error('Not authenticated');
  const deletion = await ctx.db
    .query('deletionJobs')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first();
  if (deletion) throw new Error('Account deletion is in progress');
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique();
  if (!profile) throw new Error('Profile not found');
  return profile;
};

export const getMyTranslation = query({
  args: { locale: v.string() },
  returns: v.union(v.null(), overlayValidator),
  handler: async (ctx, args) => {
    const profile = await ownerProfile(ctx);
    const locale = normalizeProfileLocale(args.locale);
    const translation = await ctx.db
      .query('profileLocales')
      .withIndex('by_profile_locale', (q) =>
        q.eq('profileId', profile._id).eq('locale', locale)
      )
      .unique();
    return translation
      ? { text: translation.text, lists: translation.lists }
      : null;
  },
});

export const saveMyTranslation = mutation({
  args: { locale: v.string(), overlay: overlayValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ownerProfile(ctx);
    const locale = normalizeProfileLocale(args.locale);
    const defaultLocale = profile.defaultLocale ?? DEFAULT_PROFILE_LOCALE;
    const locales = normalizeProfileLocales(
      profile.locales ?? [defaultLocale]
    );
    if (locale === defaultLocale || !locales.includes(locale)) {
      throw new Error('Locale is not configured');
    }
    const overlay = normalizeTranslationOverlay(args.overlay);
    const existing = await ctx.db
      .query('profileLocales')
      .withIndex('by_profile_locale', (q) =>
        q.eq('profileId', profile._id).eq('locale', locale)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...overlay, updatedAt: Date.now() });
    } else {
      await ctx.db.insert('profileLocales', {
        profileId: profile._id,
        locale,
        ...overlay,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

export const configureMyLocales = mutation({
  args: { locales: v.array(v.string()), defaultLocale: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ownerProfile(ctx);
    const locales = normalizeProfileLocales(args.locales);
    const defaultLocale = normalizeProfileLocale(args.defaultLocale);
    if (
      defaultLocale !==
      (profile.defaultLocale ?? DEFAULT_PROFILE_LOCALE)
    ) {
      throw new Error('Default locale cannot be changed after profile creation');
    }
    if (!locales.includes(defaultLocale)) {
      throw new Error('Default locale must be configured');
    }
    const removed = (profile.locales ?? [DEFAULT_PROFILE_LOCALE]).filter(
      (locale: string) => !locales.includes(locale)
    );
    for (const locale of removed) {
      const translation = await ctx.db
        .query('profileLocales')
        .withIndex('by_profile_locale', (q) =>
          q.eq('profileId', profile._id).eq('locale', locale)
        )
        .unique();
      if (translation) await ctx.db.delete(translation._id);
    }
    await ctx.db.patch(profile._id, { locales, defaultLocale });
    return null;
  },
});

export const getByUsername = query({
  args: { username: v.string(), locale: v.optional(v.string()) },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase();
    if (!/^[a-z0-9_-]{3,30}$/.test(username)) return null;
    const profile =
      (await ctx.db
        .query('profiles')
        .withIndex('by_normalized_username', (q) =>
          q.eq('normalizedUsername', username)
        )
        .unique()) ??
      (await ctx.db
        .query('profiles')
        .withIndex('by_username', (q) => q.eq('username', username))
        .unique());
    if (!profile) return null;
    const deletion = await ctx.db
      .query('deletionJobs')
      .withIndex('by_user', (q) => q.eq('userId', profile.userId))
      .first();
    if (deletion) return null;
    const state = await resolveEffectivePublicProfileState(ctx, profile);
    if (!state) return null;
    const defaultLocale = profile.defaultLocale ?? DEFAULT_PROFILE_LOCALE;
    const locale = args.locale
      ? normalizeProfileLocale(args.locale)
      : defaultLocale;
    if (!(profile.locales ?? [defaultLocale]).includes(locale)) return null;
    const translation =
      locale === defaultLocale
        ? null
        : await ctx.db
            .query('profileLocales')
            .withIndex('by_profile_locale', (q) =>
              q.eq('profileId', profile._id).eq('locale', locale)
            )
            .unique();
    const localizedProfile = applyTranslationOverlay(
      profile,
      translation ? { text: translation.text, lists: translation.lists } : null
    );
    return {
      ...toPublicProfile(localizedProfile, state),
      locale,
      defaultLocale,
      locales: profile.locales ?? [defaultLocale],
    };
  },
});
