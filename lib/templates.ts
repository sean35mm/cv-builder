export const TEMPLATE_IDS = [
  'classic',
  'modern',
  'minimal',
  'developer',
  'creative',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type TemplateWidth = 'standard' | 'wide';

export type TemplateDefinition = {
  id: TemplateId;
  name: string;
  description: string;
  bestFor: readonly string[];
  features: readonly string[];
  publicWidth: TemplateWidth;
};

export const TEMPLATES = [
  {
    id: 'classic',
    name: 'Standard',
    description: 'A calm two-column introduction with generous project space',
    bestFor: [
      'Traditional industries',
      'Corporate roles',
      'Academic positions',
    ],
    features: [
      'Two-column layout',
      'Serif typography for headings',
      'Formal structure',
      'Date ranges on left side',
    ],
    publicWidth: 'standard',
  },
  {
    id: 'modern',
    name: 'Stream',
    description:
      'A sticky identity rail beside a clear, flowing content stream',
    bestFor: ['Tech industry', 'Startups', 'Creative roles'],
    features: [
      'Single-column layout',
      'Sans-serif typography',
      'Accent color highlights',
      'Card-based sections',
    ],
    publicWidth: 'standard',
  },
  {
    id: 'minimal',
    name: 'Focus',
    description: 'A quiet, borderless single column built for close reading',
    bestFor: ['Design roles', 'Creative fields', 'Personal brands'],
    features: [
      'Typography-first approach',
      'Generous whitespace',
      'Subtle dividers',
      'Large heading hierarchy',
    ],
    publicWidth: 'standard',
  },
  {
    id: 'developer',
    name: 'Build',
    description:
      'Compact project metadata with a practical seven-five work grid',
    bestFor: ['Engineering roles', 'Technical portfolios', 'Open source work'],
    features: [
      'Technical dossier layout',
      'Date and index gutters',
      'Technology-led projects',
      'Monospace accents',
    ],
    publicWidth: 'wide',
  },
  {
    id: 'creative',
    name: 'Studio',
    description:
      'A gallery-first canvas with alternating work and color fields',
    bestFor: ['Creative direction', 'Visual portfolios', 'Studio practices'],
    features: [
      'Oversized editorial masthead',
      'Asymmetric composition',
      'Image-led projects',
      'Editorial ledgers',
    ],
    publicWidth: 'wide',
  },
] as const satisfies ReadonlyArray<TemplateDefinition>;

export const DEFAULT_TEMPLATE: TemplateId = 'classic';

export function isTemplateId(value: unknown): value is TemplateId {
  return (
    typeof value === 'string' && TEMPLATE_IDS.includes(value as TemplateId)
  );
}

export function resolveTemplateId(value: unknown): TemplateId {
  return isTemplateId(value) ? value : DEFAULT_TEMPLATE;
}

export function getTemplate(id: unknown): TemplateDefinition {
  const resolvedId = resolveTemplateId(id);
  return (
    TEMPLATES.find((template) => template.id === resolvedId) ?? TEMPLATES[0]
  );
}
