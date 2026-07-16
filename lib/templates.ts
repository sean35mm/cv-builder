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
    name: 'Classic',
    description: 'Traditional two-column layout with serif headings',
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
    name: 'Modern',
    description: 'Clean single-column design with accent colors',
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
    name: 'Minimal',
    description: 'Ultra-clean typography-focused design',
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
    name: 'Developer',
    description: 'Technical build log with compact labels and strong rules',
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
    name: 'Creative',
    description: 'Editorial studio folio with image-led project stories',
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
  return TEMPLATES.find((template) => template.id === resolvedId) ?? TEMPLATES[0];
}
