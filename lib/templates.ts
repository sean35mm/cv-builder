export type TemplateId = 'classic' | 'modern' | 'minimal';

export type TemplateDefinition = {
  id: TemplateId;
  name: string;
  description: string;
  preview: string;
  bestFor: string[];
  features: string[];
};

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional two-column layout with serif headings',
    preview: '/templates/classic-preview.png',
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
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean single-column design with accent colors',
    preview: '/templates/modern-preview.png',
    bestFor: ['Tech industry', 'Startups', 'Creative roles'],
    features: [
      'Single-column layout',
      'Sans-serif typography',
      'Accent color highlights',
      'Card-based sections',
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean typography-focused design',
    preview: '/templates/minimal-preview.png',
    bestFor: ['Design roles', 'Creative fields', 'Personal brands'],
    features: [
      'Typography-first approach',
      'Generous whitespace',
      'Subtle dividers',
      'Large heading hierarchy',
    ],
  },
];

export const DEFAULT_TEMPLATE: TemplateId = 'classic';

export function getTemplate(id: TemplateId | undefined): TemplateDefinition {
  const defaultTemplate = TEMPLATES[0];
  if (!defaultTemplate) {
    throw new Error('No templates configured');
  }
  return TEMPLATES.find((t) => t.id === id) ?? defaultTemplate;
}
