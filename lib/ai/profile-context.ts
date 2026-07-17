const ALLOWED_FIELDS = new Set([
  'name',
  'title',
  'industry',
  'location',
  'bio',
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
]);

const PRIVATE_KEYS = new Set([
  '_id',
  'id',
  '_creationTime',
  'userId',
  'email',
  'website',
  'github',
  'linkedin',
  'twitter',
  'avatar',
  'images',
  'link',
  'url',
  'credentialId',
  'contact',
  'media',
  'links',
]);
const FIELD_SECTIONS: Record<string, string> = {
  name: 'header',
  title: 'header',
  industry: 'header',
  location: 'header',
  bio: 'bio',
};

const textOnly = (value: unknown): unknown => {
  if (typeof value === 'string') return value.slice(0, 2_000);
  if (Array.isArray(value)) return value.slice(0, 50).map(textOnly);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !PRIVATE_KEYS.has(key))
      .map(([key, child]) => [key, textOnly(child)])
  );
};

export function selectAiProfileContext(
  profile: Record<string, unknown>,
  selectedFields: string[],
  sectionsVisibility?: Record<string, boolean>
): Record<string, unknown> {
  if (!selectedFields.length || selectedFields.length > 15) {
    throw new Error('Selected fields are invalid');
  }
  const context: Record<string, unknown> = {};
  for (const field of Array.from(new Set(selectedFields))) {
    if (!ALLOWED_FIELDS.has(field)) throw new Error('Selected field is invalid');
    const section = FIELD_SECTIONS[field] ?? field;
    if (sectionsVisibility && !sectionsVisibility[section]) {
      continue;
    }
    const value = profile[field];
    if (value !== undefined) context[field] = textOnly(value);
  }
  return context;
}
