import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_TEMPLATE,
  getTemplate,
  isTemplateId,
  resolveTemplateId,
  TEMPLATE_IDS,
  TEMPLATES,
} from '../lib/templates';

const expectedIds = [
  'classic',
  'modern',
  'minimal',
  'developer',
  'creative',
];

describe('profile template catalog', () => {
  test('contains every canonical template exactly once', () => {
    expect(TEMPLATE_IDS).toEqual(expectedIds);
    expect(TEMPLATES.map((template) => template.id)).toEqual(expectedIds);
    expect(new Set(TEMPLATES.map((template) => template.id)).size).toBe(
      expectedIds.length
    );
    expect(TEMPLATES.every((template) => isTemplateId(template.id))).toBe(true);
  });

  test('falls back safely for missing and unknown persisted values', () => {
    expect(DEFAULT_TEMPLATE).toBe('classic');
    expect(resolveTemplateId(undefined)).toBe('classic');
    expect(resolveTemplateId(null)).toBe('classic');
    expect(resolveTemplateId('legacy-template')).toBe('classic');
    expect(getTemplate('legacy-template').id).toBe('classic');

    for (const id of expectedIds) {
      expect(resolveTemplateId(id)).toBe(id);
      expect(getTemplate(id).id).toBe(id);
    }
  });

  test('uses CSS selector previews and explicit public width metadata', () => {
    expect(
      TEMPLATES.every((template) => !Object.hasOwn(template, 'preview'))
    ).toBe(true);
    expect(
      TEMPLATES.filter((template) => template.publicWidth === 'wide').map(
        (template) => template.id
      )
    ).toEqual(['developer', 'creative']);
    expect(
      TEMPLATES.filter((template) => template.publicWidth === 'standard').map(
        (template) => template.id
      )
    ).toEqual(['classic', 'modern', 'minimal']);
  });
});
