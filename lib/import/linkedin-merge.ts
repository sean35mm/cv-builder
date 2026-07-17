import type { ProfileUpdateFormValues } from '@/lib/profile/editor';
import {
  certificationDedupeKey,
  educationDedupeKey,
  experienceDedupeKey,
  languageDedupeKey,
  projectDedupeKey,
  publicationDedupeKey,
  skillDedupeKey,
} from './linkedin-dedupe';
import type {
  LinkedInImportData,
  LinkedInImportSection,
} from './linkedin-types';

const appendUnique = <T>(
  current: T[],
  imported: T[],
  key: (value: T) => string
): T[] => {
  const seen = new Set(current.map(key));
  const result = [...current];
  for (const entry of imported) {
    const semanticKey = key(entry);
    if (seen.has(semanticKey) || result.length >= 50) continue;
    seen.add(semanticKey);
    result.push(entry);
  }
  return result;
};

export function mergeLinkedInImport(
  current: ProfileUpdateFormValues,
  imported: LinkedInImportData,
  selectedSections: ReadonlySet<LinkedInImportSection>
): ProfileUpdateFormValues {
  const selected = (section: LinkedInImportSection) =>
    selectedSections.has(section);
  return {
    ...current,
    experience: selected('experience')
      ? appendUnique(
          current.experience,
          imported.experience,
          experienceDedupeKey
        )
      : current.experience,
    education: selected('education')
      ? appendUnique(current.education, imported.education, educationDedupeKey)
      : current.education,
    skills: selected('skills')
      ? appendUnique(current.skills, imported.skills, skillDedupeKey)
      : current.skills,
    certifications: selected('certifications')
      ? appendUnique(
          current.certifications,
          imported.certifications,
          certificationDedupeKey
        )
      : current.certifications,
    projects: selected('projects')
      ? appendUnique(current.projects, imported.projects, projectDedupeKey)
      : current.projects,
    languages: selected('languages')
      ? appendUnique(current.languages, imported.languages, languageDedupeKey)
      : current.languages,
    publications: selected('publications')
      ? appendUnique(
          current.publications,
          imported.publications,
          publicationDedupeKey
        )
      : current.publications,
  };
}
