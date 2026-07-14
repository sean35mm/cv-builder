import {
  DEFAULT_SECTIONS_ORDER,
  SECTION_IDS,
  type ProfileContent,
  type SectionId,
  type SectionsVisibility,
} from './domain';

type ContactContent = Pick<
  ProfileContent,
  'email' | 'website' | 'github' | 'linkedin' | 'twitter'
>;

export type VisibleSectionsOptions = {
  sectionsOrder?: unknown;
  sectionsVisibility?: SectionsVisibility;
  testimonialCount?: number;
};

const isSectionId = (value: unknown): value is SectionId =>
  typeof value === 'string' && SECTION_IDS.includes(value as SectionId);

const hasItems = (value: unknown): boolean =>
  Array.isArray(value) && value.length > 0;

export function resolveCompleteSectionOrder(order?: unknown): SectionId[] {
  const result: SectionId[] = [];
  const seen = new Set<SectionId>();

  if (Array.isArray(order)) {
    for (const candidate of order) {
      if (isSectionId(candidate) && !seen.has(candidate)) {
        seen.add(candidate);
        result.push(candidate);
      }
    }
  }

  for (const section of DEFAULT_SECTIONS_ORDER) {
    if (!seen.has(section)) {
      result.push(section);
    }
  }

  return result;
}

export function hasContactContent(profile: ContactContent): boolean {
  return Boolean(
    profile.email ||
    profile.website ||
    profile.github ||
    profile.linkedin ||
    profile.twitter
  );
}

export function hasSectionContent(
  profile: ProfileContent,
  section: SectionId,
  testimonialCount = 0
): boolean {
  switch (section) {
    case 'header':
      return true;
    case 'bio':
      return Boolean(profile.bio);
    case 'contact':
      return hasContactContent(profile);
    case 'experience':
      return hasItems(profile.experience);
    case 'education':
      return hasItems(profile.education);
    case 'skills':
      return hasItems(profile.skills);
    case 'projects':
      return hasItems(profile.projects);
    case 'certifications':
      return hasItems(profile.certifications);
    case 'volunteering':
      return hasItems(profile.volunteering);
    case 'exhibitions':
      return hasItems(profile.exhibitions);
    case 'awards':
      return hasItems(profile.awards);
    case 'testimonials':
      return testimonialCount > 0;
    default:
      return false;
  }
}

export function resolveVisibleSections(
  profile: ProfileContent,
  options: VisibleSectionsOptions = {}
): SectionId[] {
  const order = resolveCompleteSectionOrder(
    options.sectionsOrder ?? profile.sectionsOrder
  );

  return order.filter(
    (section) =>
      options.sectionsVisibility?.[section] !== false &&
      hasSectionContent(profile, section, options.testimonialCount)
  );
}
