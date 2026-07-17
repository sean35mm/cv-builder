import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  ProjectEntry,
  PublicationEntry,
} from '@/lib/profile/domain';

type DedupeField = string | boolean | undefined | readonly string[];

export const normalizeLinkedInDedupeText = (value: string): string =>
  value.normalize('NFC').toLowerCase();

const semanticKey = (fields: readonly DedupeField[]): string =>
  JSON.stringify(
    fields.map((field) => {
      if (Array.isArray(field)) return field.map(normalizeLinkedInDedupeText);
      if (typeof field === 'string') return normalizeLinkedInDedupeText(field);
      return field ?? '';
    })
  );

export const skillDedupeKey = (skill: string): string => semanticKey([skill]);

export const experienceDedupeKey = (entry: ExperienceEntry): string =>
  semanticKey([
    entry.role,
    entry.company,
    entry.startDate,
    entry.endDate,
    entry.current,
    entry.description,
  ]);

export const educationDedupeKey = (entry: EducationEntry): string =>
  semanticKey([
    entry.degree,
    entry.school,
    entry.startDate,
    entry.endDate,
    entry.current,
    entry.description,
  ]);

export const certificationDedupeKey = (entry: CertificationEntry): string =>
  semanticKey([
    entry.name,
    entry.issuer,
    entry.year,
    entry.credentialId,
    entry.link,
    entry.description,
  ]);

export const projectDedupeKey = (entry: ProjectEntry): string =>
  semanticKey([
    entry.title,
    entry.year,
    entry.company,
    entry.link,
    entry.description,
    entry.images,
    entry.technologies,
    entry.category,
    entry.isFeatured ?? false,
  ]);

export const languageDedupeKey = (entry: LanguageEntry): string =>
  semanticKey([entry.name, entry.proficiency]);

export const publicationDedupeKey = (entry: PublicationEntry): string =>
  semanticKey([
    entry.title,
    entry.publisher,
    entry.date,
    entry.url,
    entry.authors,
    entry.description,
  ]);
