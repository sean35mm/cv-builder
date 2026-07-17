import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { query } from './_generated/server';
import {
  applyTranslationOverlay,
  DEFAULT_PROFILE_LOCALE,
  normalizeProfileLocale,
} from '../lib/profile/locales';
import { resolveEffectiveProfilePresentationState } from './publicProfiles';
import { resolveCompleteSectionOrder } from '../lib/profile/rendering';
import { PUBLIC_SECTION_IDS, type PublicSectionId } from './publicProfiles';

export const getMySource = query({
  args: {
    versionId: v.optional(v.id('resumeVersions')),
    locale: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const deletion = await ctx.db
      .query('deletionJobs')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
    if (deletion) return null;
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    if (!profile) return null;
    let state = await resolveEffectiveProfilePresentationState(ctx, profile);
    if (args.versionId) {
      const version = await ctx.db.get(args.versionId);
      if (!version || version.profileId !== profile._id) return null;
      state = {
        sectionsOrder: resolveCompleteSectionOrder(
          version.sectionsOrder ?? profile.sectionsOrder
        ),
        sectionsVisibility: Object.fromEntries(
          PUBLIC_SECTION_IDS.map((section) => [
            section,
            version.sectionsVisibility[section] === true,
          ])
        ) as Record<PublicSectionId, boolean>,
      };
    }
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
    return {
      profile: applyTranslationOverlay(
        profile,
        translation ? { text: translation.text, lists: translation.lists } : null
      ),
      state,
      locale,
      overlay: null,
    };
  },
});
