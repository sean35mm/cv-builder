// Every ID a profile may have stored. Only TEMPLATES are offered in the app;
// retired IDs render as their closest offered template.
export const TEMPLATE_IDS = [
  'classic',
  'modern',
  'minimal',
  'developer',
  'creative',
] as const;

export const TEMPLATES = [
  {
    id: 'classic',
    name: 'Editorial',
    description:
      'One calm column with serif headings. Reads like a profile in print.',
  },
  {
    id: 'modern',
    name: 'Rail',
    description:
      'Your identity pinned beside the work. Best with several roles or projects.',
  },
  {
    id: 'minimal',
    name: 'Ledger',
    description:
      'Dense and typographic, dates in a mono gutter. Everything on one screen.',
  },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]['id'];

export const DEFAULT_TEMPLATE: TemplateId = 'classic';

const RETIRED_TEMPLATES: Record<string, TemplateId> = {
  developer: 'minimal',
  creative: 'modern',
};

export function isTemplateId(value: unknown): value is TemplateId {
  return TEMPLATES.some((template) => template.id === value);
}

export function resolveTemplateId(value: unknown): TemplateId {
  if (isTemplateId(value)) return value;
  if (typeof value === 'string' && value in RETIRED_TEMPLATES) {
    return RETIRED_TEMPLATES[value];
  }
  return DEFAULT_TEMPLATE;
}

export function getTemplate(id: unknown) {
  const resolvedId = resolveTemplateId(id);
  return (
    TEMPLATES.find((template) => template.id === resolvedId) ?? TEMPLATES[0]
  );
}
