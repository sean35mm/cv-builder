import {
  SECTION_IDS,
  type SectionId,
  type SectionsVisibility,
} from '@/lib/profile/domain';
import {
  resolveSectionsOrder,
  type ProfileUpdateFormValues,
} from '@/lib/profile/editor';

export const SECTION_LABELS: Record<SectionId, string> = {
  header: 'General',
  bio: 'About',
  contact: 'Contact',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  languages: 'Languages',
  projects: 'Projects',
  publications: 'Publications',
  certifications: 'Certifications',
  volunteering: 'Volunteering',
  exhibitions: 'Exhibitions',
  awards: 'Awards',
  interests: 'Interests',
  testimonials: 'Testimonials',
};

export const INITIAL_ACTIVE_SECTION: SectionId = 'header';

export const DRAGGABLE_SECTION_IDS = [
  'experience',
  'education',
  'skills',
  'languages',
  'projects',
  'publications',
  'certifications',
  'volunteering',
  'exhibitions',
  'awards',
  'interests',
] as const satisfies ReadonlyArray<SectionId>;

const INVALID_SECTION_PRIORITY = [
  'experience',
  'education',
  'skills',
  'languages',
  'publications',
  'interests',
] as const satisfies ReadonlyArray<keyof ProfileUpdateFormValues>;

export const createInitialSectionsVisibility = (): SectionsVisibility =>
  Object.fromEntries(SECTION_IDS.map((section) => [section, true]));

export const getDraggableSectionOrder = (
  order: ReadonlyArray<SectionId>
): SectionId[] =>
  order.filter((section) =>
    DRAGGABLE_SECTION_IDS.includes(
      section as (typeof DRAGGABLE_SECTION_IDS)[number]
    )
  );

export const mergeDraggableSectionOrder = (
  currentOrder: ReadonlyArray<string> | undefined,
  reorderedDraggableSections: ReadonlyArray<SectionId>
): SectionId[] => {
  const completeOrder = resolveSectionsOrder(currentOrder);
  const requestedOrder = Array.from(
    new Set(getDraggableSectionOrder(reorderedDraggableSections))
  );
  const remainingSections = getDraggableSectionOrder(completeOrder).filter(
    (section) => !requestedOrder.includes(section)
  );
  const completeDraggableOrder = [...requestedOrder, ...remainingSections];
  let draggableIndex = 0;

  return completeOrder.map((section) => {
    if (
      !DRAGGABLE_SECTION_IDS.includes(
        section as (typeof DRAGGABLE_SECTION_IDS)[number]
      )
    ) {
      return section;
    }

    return completeDraggableOrder[draggableIndex++];
  });
};

export const getSectionForInvalidRoot = (
  invalidRoots: Partial<Record<keyof ProfileUpdateFormValues, unknown>>
): SectionId => {
  for (const section of INVALID_SECTION_PRIORITY) {
    if (invalidRoots[section]) {
      return section;
    }
  }

  return INITIAL_ACTIVE_SECTION;
};
