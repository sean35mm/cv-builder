export const MAX_PROFILE_LOCALES = 5;
export const DEFAULT_PROFILE_LOCALE = 'en';
export const MAX_TRANSLATION_CHARACTERS = 20_000;

export type ProfileTranslationOverlay = {
  text: Record<string, string>;
  lists: Record<string, string[]>;
};

const SCALAR_FIELDS = new Set(['name', 'title', 'industry', 'location', 'bio']);
const SECTION_FIELDS: Record<string, ReadonlySet<string>> = {
  experience: new Set(['role', 'company', 'description']),
  education: new Set(['degree', 'school', 'description']),
  languages: new Set(['name']),
  projects: new Set(['title', 'company', 'description', 'category']),
  publications: new Set(['title', 'publisher', 'date', 'description']),
  certifications: new Set(['name', 'issuer', 'description']),
  volunteering: new Set(['role', 'organization', 'description']),
  exhibitions: new Set(['title', 'venue', 'location', 'description']),
  awards: new Set(['title', 'issuer', 'description']),
};
const LIST_FIELDS = new Set(['skills', 'interests']);
const SECTION_LIST_FIELDS: Record<string, ReadonlySet<string>> = {
  projects: new Set(['technologies']),
  publications: new Set(['authors']),
};

export const normalizeProfileLocale = (value: string): string => {
  const candidate = value.trim().replace(/_/g, '-');
  if (!candidate || candidate.length > 35) throw new Error('Locale is invalid');
  let canonical: string;
  try {
    [canonical] = Intl.getCanonicalLocales(candidate);
  } catch {
    throw new Error('Locale is invalid');
  }
  if (!canonical || !/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(canonical)) {
    throw new Error('Locale is invalid');
  }
  return canonical;
};

export const normalizeProfileLocales = (values: string[]): string[] => {
  if (values.length > MAX_PROFILE_LOCALES) {
    throw new Error(`Profiles support at most ${MAX_PROFILE_LOCALES} locales`);
  }
  return Array.from(new Set(values.map(normalizeProfileLocale)));
};

const validTextPath = (path: string): boolean => {
  if (SCALAR_FIELDS.has(path)) return true;
  const [section, id, field, extra] = path.split('.');
  return Boolean(
    !extra &&
      section &&
      id &&
      /^[A-Za-z0-9_-]{1,100}$/.test(id) &&
      field &&
      SECTION_FIELDS[section]?.has(field)
  );
};

const validListPath = (path: string): boolean => {
  if (LIST_FIELDS.has(path)) return true;
  const [section, id, field, extra] = path.split('.');
  return Boolean(
    !extra &&
      section &&
      id &&
      /^[A-Za-z0-9_-]{1,100}$/.test(id) &&
      field &&
      SECTION_LIST_FIELDS[section]?.has(field)
  );
};

export function normalizeTranslationOverlay(
  overlay: ProfileTranslationOverlay
): ProfileTranslationOverlay {
  const textEntries = Object.entries(overlay.text ?? {});
  const listEntries = Object.entries(overlay.lists ?? {});
  if (textEntries.length + listEntries.length > 500) {
    throw new Error('Translation has too many fields');
  }
  let characters = 0;
  const text: Record<string, string> = {};
  const lists: Record<string, string[]> = {};
  for (const [path, rawValue] of textEntries) {
    if (!validTextPath(path) || typeof rawValue !== 'string') {
      throw new Error('Translation field is invalid');
    }
    const value = rawValue.trim();
    if (value.length > 2_000) throw new Error('Translation value is too long');
    characters += value.length;
    if (value) text[path] = value;
  }
  for (const [path, rawValues] of listEntries) {
    if (!validListPath(path) || !Array.isArray(rawValues) || rawValues.length > 50) {
      throw new Error('Translation list is invalid');
    }
    const values = rawValues.map((rawValue) => {
      if (typeof rawValue !== 'string') throw new Error('Translation list is invalid');
      const value = rawValue.trim();
      if (!value || value.length > 200) throw new Error('Translation value is invalid');
      characters += value.length;
      return value;
    });
    lists[path] = values;
  }
  if (characters > MAX_TRANSLATION_CHARACTERS) {
    throw new Error('Translation is too large');
  }
  return { text, lists };
}

export function applyTranslationOverlay<T extends object>(
  profile: T,
  overlay?: ProfileTranslationOverlay | null
): T {
  if (!overlay) return profile;
  const result = { ...profile } as Record<string, unknown>;
  for (const [path, value] of Object.entries(overlay.text)) {
    if (SCALAR_FIELDS.has(path)) {
      result[path] = value;
      continue;
    }
    const [section, id, field] = path.split('.');
    const entries = result[section];
    if (!Array.isArray(entries)) continue;
    result[section] = entries.map((entry: unknown) =>
      entry && typeof entry === 'object' && 'id' in entry && entry.id === id
        ? { ...entry, [field]: value }
        : entry
    );
  }
  for (const [path, values] of Object.entries(overlay.lists)) {
    if (LIST_FIELDS.has(path)) {
      result[path] = [...values];
      continue;
    }
    const [section, id, field] = path.split('.');
    const entries = result[section];
    if (!Array.isArray(entries)) continue;
    result[section] = entries.map((entry: unknown) =>
      entry && typeof entry === 'object' && 'id' in entry && entry.id === id
        ? { ...entry, [field]: [...values] }
        : entry
    );
  }
  return result as T;
}
