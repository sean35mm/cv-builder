import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  ProjectEntry,
  PublicationEntry,
} from '@/lib/profile/domain';

export const LINKEDIN_IMPORT_SECTIONS = [
  'experience',
  'education',
  'skills',
  'certifications',
  'projects',
  'languages',
  'publications',
] as const;

export type LinkedInImportSection = (typeof LINKEDIN_IMPORT_SECTIONS)[number];

export type LinkedInImportData = {
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  certifications: CertificationEntry[];
  projects: ProjectEntry[];
  languages: LanguageEntry[];
  publications: PublicationEntry[];
};

export type LinkedInImportResult = {
  data: LinkedInImportData;
  warnings: string[];
  ignoredFiles: string[];
  parsedFiles: string[];
};

export const emptyLinkedInImportData = (): LinkedInImportData => ({
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  projects: [],
  languages: [],
  publications: [],
});
