import { v } from 'convex/values';
import { query } from './_generated/server';
import { resolveProfileAccessMode } from '../lib/profile/access';
import { resolveEffectivePublicProfileState } from './publicProfiles';
import { toPublicProfile } from './profileValidators';
import { applyTranslationOverlay, DEFAULT_PROFILE_LOCALE, normalizeProfileLocale } from '../lib/profile/locales';

export const getProfile = query({
  args: { username: v.string(), locale: v.optional(v.string()) },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const username = args.username.toLowerCase();
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
    const mode = resolveProfileAccessMode(
      profile.isPublic,
      profile.isDirectoryListed,
      profile.accessMode
    );
    if (mode !== 'public' && !(mode === 'unlisted' && profile.allowEmbed === true)) {
      return null;
    }
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
    const localized = toPublicProfile(localizedProfile, state);
    return {
      username: localized.username,
      name: localized.name,
      title: localized.title,
      bio: localized.bio,
      skills: localized.skills.slice(0, 20),
      experience: localized.experience.slice(0, 10).map((item) => ({
        role: item.role,
        company: item.company,
        description: item.description,
      })),
      locale,
    };
  },
});
