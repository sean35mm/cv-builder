import type { Doc } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { SECTION_IDS, type SectionId } from '../lib/profile/domain';
import { resolveCompleteSectionOrder } from '../lib/profile/rendering';

export const PUBLIC_SECTION_IDS = SECTION_IDS;

export type PublicSectionId = SectionId;

export type EffectivePublicProfileState = {
  sectionsOrder: PublicSectionId[];
  sectionsVisibility: Record<PublicSectionId, boolean>;
};

export async function resolveEffectivePublicProfileState(
  ctx: QueryCtx | MutationCtx,
  profile: Doc<'profiles'>
): Promise<EffectivePublicProfileState | null> {
  if (!profile.isPublic) return null;

  if (!profile.defaultVersionId) {
    return {
      sectionsOrder: resolveCompleteSectionOrder(profile.sectionsOrder),
      sectionsVisibility: Object.fromEntries(
        PUBLIC_SECTION_IDS.map((section) => [section, true])
      ) as Record<PublicSectionId, boolean>,
    };
  }

  const version = await ctx.db.get(profile.defaultVersionId);
  if (!version || version.profileId !== profile._id) return null;

  return {
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
