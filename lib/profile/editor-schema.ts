import { z } from 'zod';
import {
  SECTION_IDS,
  type AwardEntry,
  type CertificationEntry,
  type EducationEntry,
  type ExhibitionEntry,
  type ExperienceEntry,
  LANGUAGE_PROFICIENCIES,
  type LanguageEntry,
  type ProjectEntry,
  type PublicationEntry,
  type VolunteeringEntry,
} from './domain';
import type { PersistedProfileInput, ProfileUpdateFormValues } from './editor';
import { MAX_MANAGED_IMAGES_PER_ENTRY, parseManagedMediaUrl } from './media';

export const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const monthStringSchema = z
  .string()
  .min(1, 'Select a month')
  .max(50, 'Date must be 50 characters or fewer');

export const optionalMonthStringSchema = z
  .string()
  .max(50, 'Date must be 50 characters or fewer')
  .optional();

export const yearRegex = /^\d{4}$/;

export const yearStringSchema = z
  .string()
  .min(1, 'Year is required')
  .max(20, 'Year must be 20 characters or fewer');

export const optionalYearStringSchema = z
  .string()
  .max(20, 'Year must be 20 characters or fewer')
  .optional();

export const urlOptionalSchema = z
  .string()
  .trim()
  .max(500, 'URL must be 500 characters or fewer')
  .refine(
    (value) =>
      value === '' ||
      /^https?:\/\//i.test(value) ||
      /^[\w.-]+\.[A-Za-z]{2,}(\/.*)?$/.test(value),
    { message: 'Enter a valid URL' }
  )
  .optional();

const managedImageSchema = z.string().refine(
  (value) => parseManagedMediaUrl(value) !== null,
  'Choose an uploaded image'
);

export const experienceEntrySchema: z.ZodType<
  ExperienceEntry,
  ExperienceEntry
> = z
  .object({
    id: z.string().min(1, 'Identifier missing'),
    role: z.string().trim().min(1, 'Role is required').max(120),
    company: z.string().trim().min(1, 'Company is required').max(120),
    startDate: monthStringSchema,
    endDate: optionalMonthStringSchema,
    current: z.boolean(),
    description: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.current) {
      return;
    }

    const endDate = value.endDate ?? '';
    if (!endDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date required unless current',
        path: ['endDate'],
      });
      return;
    }

    if (
      monthRegex.test(value.startDate) &&
      monthRegex.test(endDate) &&
      endDate < value.startDate
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date cannot be before start date',
        path: ['endDate'],
      });
    }
  });

export const educationEntrySchema: z.ZodType<EducationEntry, EducationEntry> = z
  .object({
    id: z.string().min(1, 'Identifier missing'),
    degree: z.string().trim().min(1, 'Degree is required').max(120),
    school: z.string().trim().min(1, 'School is required').max(120),
    startDate: monthStringSchema,
    endDate: optionalMonthStringSchema,
    current: z.boolean(),
    description: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.current) {
      return;
    }

    const endDate = value.endDate ?? '';
    if (!endDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date required unless currently studying',
        path: ['endDate'],
      });
      return;
    }

    if (
      monthRegex.test(value.startDate) &&
      monthRegex.test(endDate) &&
      endDate < value.startDate
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date cannot be before start date',
        path: ['endDate'],
      });
    }
  });

export const skillSchema = z
  .string()
  .trim()
  .min(1, 'Skill cannot be empty')
  .max(50);

export const languageEntrySchema: z.ZodType<LanguageEntry, LanguageEntry> =
  z.object({
    id: z.string().min(1, 'Identifier missing').max(100),
    name: z.string().trim().min(1, 'Language is required').max(100),
    proficiency: z.enum(LANGUAGE_PROFICIENCIES).optional(),
  });

export const publicationEntrySchema: z.ZodType<
  PublicationEntry,
  PublicationEntry
> = z.object({
  id: z.string().min(1, 'Identifier missing').max(100),
  title: z.string().trim().min(1, 'Title is required').max(200),
  publisher: z.string().trim().max(160).optional(),
  date: z.string().trim().max(100).optional(),
  url: urlOptionalSchema,
  authors: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  description: z.string().trim().max(1000).optional(),
});

export const projectEntrySchema: z.ZodType<ProjectEntry, ProjectEntry> =
  z.object({
    id: z.string().min(1, 'Identifier missing'),
    title: z.string().trim().min(1, 'Title is required').max(160),
    year: yearStringSchema,
    company: z.string().trim().max(160).optional(),
    link: urlOptionalSchema,
    description: z.string().trim().max(1000).optional(),
    images: z.array(z.string()).max(MAX_MANAGED_IMAGES_PER_ENTRY).optional(),
    technologies: z.array(z.string().trim().min(1).max(50)).optional(),
    category: z.string().trim().max(80).optional(),
    isFeatured: z.boolean().optional(),
  });

export const certificationEntrySchema: z.ZodType<
  CertificationEntry,
  CertificationEntry
> = z.object({
  id: z.string().min(1, 'Identifier missing'),
  name: z.string().trim().min(1, 'Name is required').max(160),
  issuer: z.string().trim().min(1, 'Issuer is required').max(160),
  year: optionalYearStringSchema,
  credentialId: z.string().trim().max(160).optional(),
  link: urlOptionalSchema,
  description: z.string().trim().max(1000).optional(),
});

export const volunteeringEntrySchema: z.ZodType<
  VolunteeringEntry,
  VolunteeringEntry
> = z
  .object({
    id: z.string().min(1, 'Identifier missing'),
    role: z.string().trim().min(1, 'Role is required').max(160),
    organization: z.string().trim().min(1, 'Organization is required').max(160),
    startDate: monthStringSchema,
    endDate: optionalMonthStringSchema,
    current: z.boolean(),
    description: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.current) {
      return;
    }
    const endDate = value.endDate ?? '';
    if (!endDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date required unless current',
        path: ['endDate'],
      });
      return;
    }
    if (
      monthRegex.test(value.startDate) &&
      monthRegex.test(endDate) &&
      endDate < value.startDate
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date cannot be before start date',
        path: ['endDate'],
      });
    }
  });

export const exhibitionEntrySchema: z.ZodType<
  ExhibitionEntry,
  ExhibitionEntry
> = z.object({
  id: z.string().min(1, 'Identifier missing'),
  title: z.string().trim().min(1, 'Title is required').max(160),
  venue: z.string().trim().max(160).optional(),
  year: yearStringSchema,
  location: z.string().trim().max(160).optional(),
  link: urlOptionalSchema,
  description: z.string().trim().max(1000).optional(),
  images: z.array(managedImageSchema).max(MAX_MANAGED_IMAGES_PER_ENTRY).optional(),
});

export const awardEntrySchema: z.ZodType<AwardEntry, AwardEntry> = z.object({
  id: z.string().min(1, 'Identifier missing'),
  title: z.string().trim().min(1, 'Title is required').max(160),
  issuer: z.string().trim().min(1, 'Issuer is required').max(160),
  year: yearStringSchema,
  link: urlOptionalSchema,
  description: z.string().trim().max(1000).optional(),
  images: z.array(managedImageSchema).max(MAX_MANAGED_IMAGES_PER_ENTRY).optional(),
});

export const profileUpdateFormBaseSchema: z.ZodType<
  ProfileUpdateFormValues,
  ProfileUpdateFormValues
> = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    avatar: z.union([z.literal(''), managedImageSchema]).optional(),
    title: z.string().trim().max(120).optional(),
    industry: z.string().trim().max(120).optional(),
    location: z.string().trim().max(120).optional(),
    bio: z.string().trim().max(300).optional(),
    email: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        {
          message: 'Enter a valid email',
        }
      )
      .optional(),
    website: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === '' ||
          /^https?:\/\//i.test(value) ||
          /^[\w.-]+\.[A-Za-z]{2,}(\/.*)?$/.test(value),
        {
          message: 'Enter a valid URL',
        }
      )
      .optional(),
    github: z.string().trim().max(120).optional(),
    linkedin: z.string().trim().max(120).optional(),
    twitter: z.string().trim().max(120).optional(),
    experience: z.array(experienceEntrySchema).max(50),
    education: z.array(educationEntrySchema).max(50),
    skills: z
      .array(skillSchema)
      .max(50, 'Keep skills list under 50 entries')
      .superRefine((skills, ctx) => {
        const normalized = skills.map((skill) => skill.toLowerCase());
        if (new Set(normalized).size !== normalized.length) {
          ctx.addIssue({
            code: 'custom',
            message: 'Skills must be unique',
          });
        }
      }),
    languages: z
      .array(languageEntrySchema)
      .max(50)
      .refine(
        (entries) =>
          new Set(entries.map((entry) => entry.name.toLocaleLowerCase())).size ===
          entries.length,
        'Languages must be unique'
      ),
    projects: z.array(projectEntrySchema).max(50),
    publications: z.array(publicationEntrySchema).max(50),
    certifications: z.array(certificationEntrySchema).max(50),
    volunteering: z.array(volunteeringEntrySchema).max(50),
    exhibitions: z.array(exhibitionEntrySchema).max(50),
    awards: z.array(awardEntrySchema).max(50),
    interests: z
      .array(z.string().trim().min(1).max(100))
      .max(50)
      .refine(
        (entries) =>
          new Set(entries.map((entry) => entry.toLocaleLowerCase())).size ===
          entries.length,
        'Interests must be unique'
      ),
    sectionsOrder: z
      .array(z.enum(SECTION_IDS))
      .refine(
        (arr) => new Set(arr).size === arr.length,
        'Sections must be unique'
      )
      .optional(),
    isPublic: z.boolean(),
    isDirectoryListed: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!values.sectionsOrder) {
      return;
    }
    for (const section of values.sectionsOrder) {
      if (!SECTION_IDS.includes(section)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Unknown section',
          path: ['sectionsOrder'],
        });
        break;
      }
    }
  });

export const createProfileUpdateFormSchema = (profile: PersistedProfileInput) =>
  profileUpdateFormBaseSchema.superRefine((values, ctx) => {
    const validateDates = (
      section: 'experience' | 'education' | 'volunteering',
      entries: Array<{
        id: string;
        startDate: string;
        endDate?: string;
        current: boolean;
      }>,
      originals: Array<{
        id: string;
        startDate: string;
        endDate?: string;
        current: boolean;
      }>
    ) => {
      const originalById = new Map(originals.map((entry) => [entry.id, entry]));
      entries.forEach((entry, index) => {
        const original = originalById.get(entry.id);
        if (
          !monthRegex.test(entry.startDate) &&
          entry.startDate !== original?.startDate
        ) {
          ctx.addIssue({
            code: 'custom',
            message: 'Select a valid month (YYYY-MM)',
            path: [section, index, 'startDate'],
          });
        }
        if (
          entry.endDate &&
          !monthRegex.test(entry.endDate) &&
          entry.endDate !== original?.endDate
        ) {
          ctx.addIssue({
            code: 'custom',
            message: 'Select a valid month (YYYY-MM)',
            path: [section, index, 'endDate'],
          });
        }
        if (
          entry.current &&
          entry.endDate &&
          !(original?.current === true && entry.endDate === original.endDate)
        ) {
          ctx.addIssue({
            code: 'custom',
            message: 'Clear end date when marked as current',
            path: [section, index, 'endDate'],
          });
        }
      });
    };

    const validateYears = (
      section: 'projects' | 'certifications' | 'exhibitions' | 'awards',
      entries: Array<{ id: string; year?: string }>,
      originals: Array<{ id: string; year?: string }>
    ) => {
      const originalById = new Map(originals.map((entry) => [entry.id, entry]));
      entries.forEach((entry, index) => {
        if (!entry.year || yearRegex.test(entry.year)) return;
        if (entry.year === originalById.get(entry.id)?.year) return;
        ctx.addIssue({
          code: 'custom',
          message: 'Enter a 4-digit year',
          path: [section, index, 'year'],
        });
      });
    };

    validateDates('experience', values.experience, profile.experience);
    validateDates('education', values.education, profile.education);
    validateDates(
      'volunteering',
      values.volunteering,
      profile.volunteering ?? []
    );
    validateYears('projects', values.projects, profile.projects ?? []);
    validateYears(
      'certifications',
      values.certifications,
      profile.certifications ?? []
    );
    validateYears('exhibitions', values.exhibitions, profile.exhibitions ?? []);
    validateYears('awards', values.awards, profile.awards ?? []);

    const originalProjects = new Map(
      (profile.projects ?? []).map((project) => [project.id, project])
    );
    values.projects.forEach((project, projectIndex) => {
      const legacyImages = new Set(
        originalProjects.get(project.id)?.images?.filter(
          (image) => parseManagedMediaUrl(image) === null
        ) ?? []
      );
      project.images?.forEach((image, imageIndex) => {
        if (parseManagedMediaUrl(image) || legacyImages.has(image)) return;
        ctx.addIssue({
          code: 'custom',
          message: 'Choose an uploaded image',
          path: ['projects', projectIndex, 'images', imageIndex],
        });
      });
    });
  });
