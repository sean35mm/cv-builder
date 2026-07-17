import {
  SECTION_IDS,
  type AwardEntry,
  type CertificationEntry,
  type EducationEntry,
  type ExhibitionEntry,
  type ExperienceEntry,
  type LanguageEntry,
  type ProfileContent,
  type ProfileUpdateInput,
  type ProjectEntry,
  type PublicationEntry,
  type SectionId,
  type VolunteeringEntry,
} from './domain';
import {
  getProfileAccessFlags,
  resolveProfileAccessMode,
  type ProfileAccessMode,
} from './access';
import { resolveCompleteSectionOrder } from './rendering';
import type { ProfileFontId } from './typography';
import { canonicalizeManagedMediaUrl } from './media';

export type ProfileUpdateFormValues = {
  name: string;
  avatar?: string;
  title?: string;
  industry?: string;
  location?: string;
  bio?: string;
  email?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  languages: LanguageEntry[];
  projects: ProjectEntry[];
  publications: PublicationEntry[];
  certifications: CertificationEntry[];
  volunteering: VolunteeringEntry[];
  exhibitions: ExhibitionEntry[];
  awards: AwardEntry[];
  interests: string[];
  sectionsOrder?: SectionId[];
  isPublic: boolean;
  isDirectoryListed: boolean;
};

export type PersistedProfileInput = {
  username: string;
  name: string;
  avatar?: string;
  title?: string;
  industry?: string;
  location?: string;
  bio?: string;
  email?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  languages?: LanguageEntry[];
  projects?: ProjectEntry[];
  publications?: PublicationEntry[];
  certifications?: CertificationEntry[];
  volunteering?: VolunteeringEntry[];
  exhibitions?: ExhibitionEntry[];
  awards?: AwardEntry[];
  interests?: string[];
  headingFont?: ProfileFontId;
  bodyFont?: ProfileFontId;
  sectionsOrder?: ReadonlyArray<string>;
  isPublic: boolean;
  isDirectoryListed?: boolean;
  accessMode?: ProfileAccessMode;
  accessVersion?: number;
};

export const createEmptyExperienceEntry = (id: string): ExperienceEntry => ({
  id,
  role: '',
  company: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
});

export const createEmptyEducationEntry = (id: string): EducationEntry => ({
  id,
  degree: '',
  school: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
});

export const createEmptyProjectEntry = (id: string): ProjectEntry => ({
  id,
  title: '',
  year: '',
  company: '',
  link: '',
  description: '',
  images: [],
  technologies: [],
  category: '',
  isFeatured: false,
});

export const createEmptyCertificationEntry = (
  id: string
): CertificationEntry => ({
  id,
  name: '',
  issuer: '',
  year: '',
  credentialId: '',
  link: '',
  description: '',
});

export const createEmptyLanguageEntry = (id: string): LanguageEntry => ({
  id,
  name: '',
});

export const createEmptyPublicationEntry = (id: string): PublicationEntry => ({
  id,
  title: '',
  publisher: '',
  date: '',
  url: '',
  authors: [],
  description: '',
});

export const createEmptyVolunteeringEntry = (
  id: string
): VolunteeringEntry => ({
  id,
  role: '',
  organization: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
});

export const createEmptyExhibitionEntry = (id: string): ExhibitionEntry => ({
  id,
  title: '',
  venue: '',
  year: '',
  location: '',
  link: '',
  description: '',
  images: [],
});

export const createEmptyAwardEntry = (id: string): AwardEntry => ({
  id,
  title: '',
  issuer: '',
  year: '',
  link: '',
  description: '',
  images: [],
});

export const optionalField = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export const canonicalizePreviewImageUrl = (image: string): string =>
  canonicalizeManagedMediaUrl(image) ?? image;

export const isSectionId = (value: string): value is SectionId =>
  SECTION_IDS.includes(value as SectionId);

export const resolveSectionsOrder = (
  order?: ReadonlyArray<string>
): SectionId[] => resolveCompleteSectionOrder(order);

const normalizeExperienceForForm = (
  entry: ExperienceEntry
): ExperienceEntry => ({
  ...entry,
  endDate: entry.endDate ?? '',
  description: entry.description ?? '',
});

const normalizeEducationForForm = (entry: EducationEntry): EducationEntry => ({
  ...entry,
  endDate: entry.endDate ?? '',
  description: entry.description ?? '',
});

const normalizeProjectForForm = (entry: ProjectEntry): ProjectEntry => ({
  ...entry,
  company: entry.company ?? '',
  link: entry.link ?? '',
  description: entry.description ?? '',
  images: entry.images ?? [],
  technologies: entry.technologies ?? [],
  category: entry.category ?? '',
  isFeatured: entry.isFeatured ?? false,
});

const normalizeCertificationForForm = (
  entry: CertificationEntry
): CertificationEntry => ({
  ...entry,
  year: entry.year ?? '',
  credentialId: entry.credentialId ?? '',
  link: entry.link ?? '',
  description: entry.description ?? '',
});

const normalizeLanguageForForm = (entry: LanguageEntry): LanguageEntry => ({
  ...entry,
  proficiency: entry.proficiency ?? undefined,
});

const normalizePublicationForForm = (
  entry: PublicationEntry
): PublicationEntry => ({
  ...entry,
  publisher: entry.publisher ?? '',
  date: entry.date ?? '',
  url: entry.url ?? '',
  authors: entry.authors ?? [],
  description: entry.description ?? '',
});

const normalizeVolunteeringForForm = (
  entry: VolunteeringEntry
): VolunteeringEntry => ({
  ...entry,
  endDate: entry.endDate ?? '',
  description: entry.description ?? '',
});

const normalizeExhibitionForForm = (
  entry: ExhibitionEntry
): ExhibitionEntry => ({
  ...entry,
  venue: entry.venue ?? '',
  location: entry.location ?? '',
  link: entry.link ?? '',
  description: entry.description ?? '',
  images: entry.images ?? [],
});

const normalizeAwardForForm = (entry: AwardEntry): AwardEntry => ({
  ...entry,
  link: entry.link ?? '',
  description: entry.description ?? '',
  images: entry.images ?? [],
});

export const toFormValues = (
  profile: PersistedProfileInput
): ProfileUpdateFormValues => ({
  name: profile.name,
  avatar: profile.avatar ?? '',
  title: profile.title ?? '',
  industry: profile.industry ?? '',
  location: profile.location ?? '',
  bio: profile.bio ?? '',
  email: profile.email ?? '',
  website: profile.website ?? '',
  github: profile.github ?? '',
  linkedin: profile.linkedin ?? '',
  twitter: profile.twitter ?? '',
  experience: profile.experience.map(normalizeExperienceForForm),
  education: profile.education.map(normalizeEducationForForm),
  skills: profile.skills,
  languages: profile.languages?.map(normalizeLanguageForForm) ?? [],
  projects: profile.projects?.map(normalizeProjectForForm) ?? [],
  publications: profile.publications?.map(normalizePublicationForForm) ?? [],
  certifications:
    profile.certifications?.map(normalizeCertificationForForm) ?? [],
  volunteering: profile.volunteering?.map(normalizeVolunteeringForForm) ?? [],
  exhibitions: profile.exhibitions?.map(normalizeExhibitionForForm) ?? [],
  awards: profile.awards?.map(normalizeAwardForForm) ?? [],
  interests: profile.interests ?? [],
  sectionsOrder: resolveSectionsOrder(profile.sectionsOrder),
  ...getProfileAccessFlags(
    resolveProfileAccessMode(
      profile.isPublic,
      profile.isDirectoryListed,
      profile.accessMode
    )
  ),
});

export const toMutationPayload = (
  values: ProfileUpdateFormValues
): ProfileUpdateInput => ({
  name: values.name.trim(),
  avatar: optionalField(values.avatar),
  title: optionalField(values.title),
  industry: optionalField(values.industry),
  location: optionalField(values.location),
  bio: optionalField(values.bio),
  email: optionalField(values.email),
  website: optionalField(values.website),
  github: optionalField(values.github),
  linkedin: optionalField(values.linkedin),
  twitter: optionalField(values.twitter),
  experience: values.experience.map((entry) => ({
    id: entry.id,
    role: entry.role.trim(),
    company: entry.company.trim(),
    startDate: entry.startDate,
    endDate:
      !entry.endDate || entry.endDate.trim() === '' ? undefined : entry.endDate,
    current: entry.current,
    description: optionalField(entry.description),
  })),
  education: values.education.map((entry) => ({
    id: entry.id,
    degree: entry.degree.trim(),
    school: entry.school.trim(),
    startDate: entry.startDate,
    endDate:
      !entry.endDate || entry.endDate.trim() === '' ? undefined : entry.endDate,
    current: entry.current,
    description: optionalField(entry.description),
  })),
  skills: Array.from(
    new Set(
      values.skills.map((skill) => skill.trim()).filter((skill) => skill !== '')
    )
  ),
  languages: Array.from(
    new Map(
      values.languages
        .map((entry) => ({
          id: entry.id,
          name: entry.name.trim(),
          proficiency: entry.proficiency,
        }))
        .filter((entry) => entry.name !== '')
        .map((entry) => [entry.name.toLocaleLowerCase(), entry])
    ).values()
  ),
  projects: values.projects.map((entry) => ({
    id: entry.id,
    title: entry.title.trim(),
    year: entry.year,
    company: optionalField(entry.company),
    link: optionalField(entry.link),
    description: optionalField(entry.description),
    images: entry.images?.filter((image) => image.trim() !== ''),
    technologies: entry.technologies
      ? Array.from(
          new Set(
            entry.technologies
              .map((technology) => technology.trim())
              .filter((technology) => technology !== '')
          )
        )
      : undefined,
    category: optionalField(entry.category),
    isFeatured: entry.isFeatured || undefined,
  })),
  publications: Array.from(
    new Map(
      values.publications.map((entry) => {
        const publication = {
          id: entry.id,
          title: entry.title.trim(),
          publisher: optionalField(entry.publisher),
          date: optionalField(entry.date),
          url: optionalField(entry.url),
          authors: entry.authors
            ? Array.from(
                new Map(
                  entry.authors
                    .map((author) => author.trim())
                    .filter(Boolean)
                    .map((author) => [author.toLocaleLowerCase(), author])
                ).values()
              )
            : undefined,
          description: optionalField(entry.description),
        };
        return [
          [
            publication.title,
            publication.publisher,
            publication.date,
            publication.url,
          ]
            .filter(Boolean)
            .join('|')
            .toLocaleLowerCase(),
          publication,
        ] as const;
      })
    ).values()
  ),
  certifications: values.certifications.map((entry) => ({
    id: entry.id,
    name: entry.name.trim(),
    issuer: entry.issuer.trim(),
    year: entry.year === '' ? undefined : entry.year,
    credentialId: optionalField(entry.credentialId),
    link: optionalField(entry.link),
    description: optionalField(entry.description),
  })),
  volunteering: values.volunteering.map((entry) => ({
    id: entry.id,
    role: entry.role.trim(),
    organization: entry.organization.trim(),
    startDate: entry.startDate,
    endDate:
      !entry.endDate || entry.endDate.trim() === '' ? undefined : entry.endDate,
    current: entry.current,
    description: optionalField(entry.description),
  })),
  exhibitions: values.exhibitions.map((entry) => ({
    id: entry.id,
    title: entry.title.trim(),
    venue: optionalField(entry.venue),
    year: entry.year,
    location: optionalField(entry.location),
    link: optionalField(entry.link),
    description: optionalField(entry.description),
    images: entry.images?.filter((image) => image.trim() !== ''),
  })),
  awards: values.awards.map((entry) => ({
    id: entry.id,
    title: entry.title.trim(),
    issuer: entry.issuer.trim(),
    year: entry.year,
    link: optionalField(entry.link),
    description: optionalField(entry.description),
    images: entry.images?.filter((image) => image.trim() !== ''),
  })),
  interests: Array.from(
    new Map(
      values.interests
        .map((interest) => interest.trim())
        .filter(Boolean)
        .map((interest) => [interest.toLocaleLowerCase(), interest])
    ).values()
  ),
  sectionsOrder: values.sectionsOrder
    ? resolveSectionsOrder(values.sectionsOrder)
    : resolveSectionsOrder(),
  ...getProfileAccessFlags(
    resolveProfileAccessMode(values.isPublic, values.isDirectoryListed)
  ),
});

export const fromMutationPayload = (
  payload: ProfileUpdateInput
): ProfileUpdateFormValues => ({
  name: payload.name,
  avatar: payload.avatar ? canonicalizePreviewImageUrl(payload.avatar) : '',
  title: payload.title ?? '',
  industry: payload.industry ?? '',
  location: payload.location ?? '',
  bio: payload.bio ?? '',
  email: payload.email ?? '',
  website: payload.website ?? '',
  github: payload.github ?? '',
  linkedin: payload.linkedin ?? '',
  twitter: payload.twitter ?? '',
  experience: payload.experience.map(normalizeExperienceForForm),
  education: payload.education.map(normalizeEducationForForm),
  skills: payload.skills,
  languages: payload.languages.map(normalizeLanguageForForm),
  projects: payload.projects.map((entry) =>
    normalizeProjectForForm({
      ...entry,
      images: entry.images?.map(canonicalizePreviewImageUrl) ?? [],
    })
  ),
  publications: payload.publications.map(normalizePublicationForForm),
  certifications: payload.certifications.map(normalizeCertificationForForm),
  volunteering: payload.volunteering.map(normalizeVolunteeringForForm),
  exhibitions: payload.exhibitions.map((entry) =>
    normalizeExhibitionForForm({
      ...entry,
      images: entry.images?.map(canonicalizePreviewImageUrl) ?? [],
    })
  ),
  awards: payload.awards.map((entry) =>
    normalizeAwardForForm({
      ...entry,
      images: entry.images?.map(canonicalizePreviewImageUrl) ?? [],
    })
  ),
  interests: payload.interests,
  sectionsOrder: resolveSectionsOrder(payload.sectionsOrder),
  ...getProfileAccessFlags(
    resolveProfileAccessMode(payload.isPublic, payload.isDirectoryListed)
  ),
});

export const toProfileContent = (
  profile: Omit<PersistedProfileInput, 'isPublic' | 'isDirectoryListed'>
): ProfileContent => ({
  username: profile.username,
  name: profile.name,
  avatar: profile.avatar ?? undefined,
  title: profile.title ?? undefined,
  industry: profile.industry ?? undefined,
  location: profile.location ?? undefined,
  bio: profile.bio ?? undefined,
  email: profile.email ?? undefined,
  website: profile.website ?? undefined,
  github: profile.github ?? undefined,
  linkedin: profile.linkedin ?? undefined,
  twitter: profile.twitter ?? undefined,
  experience: profile.experience,
  education: profile.education,
  skills: profile.skills,
  languages: profile.languages ?? [],
  projects: profile.projects ?? [],
  publications: profile.publications ?? [],
  certifications: profile.certifications ?? [],
  volunteering: profile.volunteering ?? [],
  exhibitions: profile.exhibitions ?? [],
  awards: profile.awards ?? [],
  interests: profile.interests ?? [],
  sectionsOrder: resolveSectionsOrder(profile.sectionsOrder),
});

export const toPreviewProfile = (
  profile: PersistedProfileInput,
  values: ProfileUpdateFormValues
): ProfileContent => ({
  username: profile.username,
  name: values.name,
  avatar: optionalField(values.avatar),
  title: optionalField(values.title),
  industry: optionalField(values.industry),
  location: optionalField(values.location),
  bio: optionalField(values.bio),
  email: optionalField(values.email),
  website: optionalField(values.website),
  github: optionalField(values.github),
  linkedin: optionalField(values.linkedin),
  twitter: optionalField(values.twitter),
  experience: values.experience,
  education: values.education,
  skills: values.skills,
  languages: values.languages,
  projects: values.projects,
  publications: values.publications,
  certifications: values.certifications,
  volunteering: values.volunteering,
  exhibitions: values.exhibitions,
  awards: values.awards,
  interests: values.interests,
  sectionsOrder: values.sectionsOrder,
});

export const isBlankExperience = (entry: ExperienceEntry): boolean => {
  const hasText =
    entry.role.trim() ||
    entry.company.trim() ||
    (entry.description?.trim() ?? '');
  const hasDates =
    (entry.startDate?.trim() ?? '') || (entry.endDate?.trim() ?? '');
  return !hasText && !hasDates && !entry.current;
};

export const isBlankEducation = (entry: EducationEntry): boolean => {
  const hasText =
    entry.degree.trim() ||
    entry.school.trim() ||
    (entry.description?.trim() ?? '');
  const hasDates =
    (entry.startDate?.trim() ?? '') || (entry.endDate?.trim() ?? '');
  return !hasText && !hasDates && !entry.current;
};

export const isBlankProject = (entry: ProjectEntry): boolean => {
  const hasText =
    entry.title.trim() ||
    (entry.company?.trim() ?? '') ||
    (entry.description?.trim() ?? '') ||
    (entry.link?.trim() ?? '');
  const hasYear = entry.year?.trim() ?? '';
  const hasProjectMetadata =
    (entry.images?.length ?? 0) > 0 ||
    (entry.technologies?.length ?? 0) > 0 ||
    Boolean(entry.category?.trim()) ||
    entry.isFeatured === true;
  return !hasText && !hasYear && !hasProjectMetadata;
};

export const isBlankCertification = (entry: CertificationEntry): boolean => {
  const hasText =
    entry.name.trim() ||
    entry.issuer.trim() ||
    (entry.credentialId?.trim() ?? '') ||
    (entry.description?.trim() ?? '') ||
    (entry.link?.trim() ?? '');
  const hasYear = entry.year?.trim() ?? '';
  return !hasText && !hasYear;
};

export const isBlankLanguage = (entry: LanguageEntry): boolean =>
  !entry.name.trim() && !entry.proficiency;

export const isBlankPublication = (entry: PublicationEntry): boolean =>
  !entry.title.trim() &&
  !entry.publisher?.trim() &&
  !entry.date?.trim() &&
  !entry.url?.trim() &&
  !entry.description?.trim() &&
  (entry.authors?.length ?? 0) === 0;

export const isBlankVolunteering = (entry: VolunteeringEntry): boolean => {
  const hasText =
    entry.role.trim() ||
    entry.organization.trim() ||
    (entry.description?.trim() ?? '');
  const hasDates =
    (entry.startDate?.trim() ?? '') || (entry.endDate?.trim() ?? '');
  return !hasText && !hasDates && !entry.current;
};

export const isBlankExhibition = (entry: ExhibitionEntry): boolean => {
  const hasText =
    entry.title.trim() ||
    (entry.venue?.trim() ?? '') ||
    (entry.location?.trim() ?? '') ||
    (entry.description?.trim() ?? '') ||
    (entry.link?.trim() ?? '');
  const hasYear = entry.year?.trim() ?? '';
  return !hasText && !hasYear && (entry.images?.length ?? 0) === 0;
};

export const isBlankAward = (entry: AwardEntry): boolean => {
  const hasText =
    entry.title.trim() ||
    entry.issuer.trim() ||
    (entry.description?.trim() ?? '') ||
    (entry.link?.trim() ?? '');
  const hasYear = entry.year?.trim() ?? '';
  return !hasText && !hasYear && (entry.images?.length ?? 0) === 0;
};
