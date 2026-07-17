import { applyTranslationOverlay, type ProfileTranslationOverlay } from '../profile/locales';

const MAX_EXPORT_CHARACTERS = 100_000;

export type AtsSection = { heading: string; entries: string[] };
export type AtsDocument = {
  schemaVersion: 1;
  locale: string;
  name: string;
  headline?: string;
  summary?: string;
  sections: AtsSection[];
};

const clean = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const result = Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127);
    })
    .join('')
    .trim();
  return result || undefined;
};

const join = (...values: unknown[]): string | undefined =>
  clean(values.map(clean).filter(Boolean).join(' — '));

const records = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item)
      )
    : [];

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

export function createAtsDocument(
  rawProfile: Record<string, unknown>,
  visibility: Record<string, boolean>,
  locale: string,
  overlay?: ProfileTranslationOverlay | null
): AtsDocument {
  const profile = applyTranslationOverlay(rawProfile, overlay);
  const sections: AtsSection[] = [];
  const add = (heading: string, key: string, entries: Array<string | undefined>) => {
    if (!visibility[key]) return;
    const values = entries.map(clean).filter((value): value is string => Boolean(value));
    if (values.length) sections.push({ heading, entries: values });
  };
  add(
    'Experience',
    'experience',
    records(profile.experience).map((item) =>
      join(
        item.role,
        item.company,
        item.startDate,
        item.endDate ?? (item.current === true ? 'Present' : ''),
        item.description
      )
    )
  );
  add(
    'Education',
    'education',
    records(profile.education).map((item) =>
      join(
        item.degree,
        item.school,
        item.startDate,
        item.endDate ?? (item.current === true ? 'Present' : ''),
        item.description
      )
    )
  );
  add('Skills', 'skills', [strings(profile.skills).join(', ')]);
  for (const [heading, key, fields] of [
    ['Languages', 'languages', ['name', 'proficiency']],
    ['Projects', 'projects', ['title', 'company', 'year', 'description', 'technologies']],
    ['Publications', 'publications', ['title', 'publisher', 'date', 'authors', 'description']],
    ['Certifications', 'certifications', ['name', 'issuer', 'year', 'description']],
    ['Volunteering', 'volunteering', ['role', 'organization', 'startDate', 'endDate', 'description']],
    ['Exhibitions', 'exhibitions', ['title', 'venue', 'year', 'location', 'description']],
    ['Awards', 'awards', ['title', 'issuer', 'year', 'description']],
  ] as const) {
    add(
      heading,
      key,
      records(profile[key]).map((item) =>
        join(
          ...fields.map((field) =>
            Array.isArray(item[field])
              ? strings(item[field]).join(', ')
              : item[field]
          )
        )
      )
    );
  }
  add('Interests', 'interests', [strings(profile.interests).join(', ')]);
  const document: AtsDocument = {
    schemaVersion: 1,
    locale,
    name:
      (visibility.header ? clean(profile.name) : undefined) ??
      clean(profile.username) ??
      'Resume',
    ...(visibility.header && clean(profile.title) ? { headline: clean(profile.title) } : {}),
    ...(visibility.bio && clean(profile.bio) ? { summary: clean(profile.bio) } : {}),
    sections,
  };
  if (JSON.stringify(document).length > MAX_EXPORT_CHARACTERS) {
    throw new Error('Export is too large');
  }
  return document;
}

export const atsDocumentToText = (document: AtsDocument): string =>
  [
    document.name,
    document.headline,
    document.summary,
    ...document.sections.flatMap((section) => [
      section.heading.toUpperCase(),
      ...section.entries,
    ]),
  ]
    .filter(Boolean)
    .join('\n\n');

export const sanitizedExportFilename = (name: string, extension: string): string => {
  const base = name
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9 _-]/g, '')
    .trim()
    .replace(/[ _]+/g, '_')
    .slice(0, 80);
  return `${base || 'resume'}.${extension}`;
};
