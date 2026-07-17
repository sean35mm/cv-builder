import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ClassicView } from '../components/templates/classic-view';
import { CreativeView } from '../components/templates/creative-view';
import { DeveloperView } from '../components/templates/developer-view';
import { MinimalView } from '../components/templates/minimal-view';
import { ModernView } from '../components/templates/modern-view';
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

  test('all templates render one heading plus accessible managed profile media', () => {
    const profile = {
      username: 'ada',
      name: 'Ada Lovelace',
      avatar: '/api/storage/avatar?profile=ada',
      experience: [],
      education: [],
      skills: [],
      languages: [{ id: 'language', name: 'English', proficiency: 'native' }],
      projects: [],
      publications: [{ id: 'publication', title: 'Computing Notes' }],
      certifications: [],
      volunteering: [],
      exhibitions: [
        {
          id: 'show',
          title: 'Engine Show',
          year: '1843',
          images: ['/api/storage/show?profile=ada'],
        },
      ],
      awards: [
        {
          id: 'award',
          title: 'Mathematics Prize',
          issuer: 'Society',
          year: '1843',
          images: ['/api/storage/award?profile=ada'],
        },
      ],
      interests: ['Mathematics'],
    };

    for (const Template of [
      ClassicView,
      ModernView,
      MinimalView,
      DeveloperView,
      CreativeView,
    ]) {
      const html = renderToStaticMarkup(createElement(Template, { profile }));
      expect(html.match(/<h1/g)?.length).toBe(1);
      expect(html).toContain('alt="Ada Lovelace profile portrait"');
      expect(html).toContain('alt="Engine Show image 1"');
      expect(html).toContain('alt="Mathematics Prize image 1"');
      expect(html).toContain('Languages');
      expect(html).toContain('Computing Notes');
      expect(html).toContain('Mathematics');
      expect(html).not.toContain('carousel');
    }
  });

  test('all templates retain exactly one username h1 when the visual header is hidden', () => {
    const profile = {
      username: 'ada',
      name: 'Ada Lovelace',
      title: 'Hidden title',
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      volunteering: [],
      exhibitions: [],
      awards: [],
    };

    for (const Template of [
      ClassicView,
      ModernView,
      MinimalView,
      DeveloperView,
      CreativeView,
    ]) {
      const html = renderToStaticMarkup(
        createElement(Template, {
          profile,
          sectionsVisibility: { header: false },
        })
      );
      expect(html.match(/<h1/g)?.length).toBe(1);
      expect(html).toContain('<h1 class="sr-only">ada</h1>');
      expect(html).not.toContain('Ada Lovelace');
      expect(html).not.toContain('Hidden title');
    }
  });

  test('all visible template names contain long unbroken values', () => {
    const profile = {
      username: 'ada',
      name: 'A'.repeat(120),
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      volunteering: [],
      exhibitions: [],
      awards: [],
    };

    for (const Template of [
      ClassicView,
      ModernView,
      MinimalView,
      DeveloperView,
      CreativeView,
    ]) {
      const html = renderToStaticMarkup(createElement(Template, { profile }));
      const heading = html.match(/<h1 class="([^"]+)"/);
      expect(heading?.[1]).toContain('min-w-0');
      expect(heading?.[1]).toContain('break-words');
      expect(heading?.[1]).toContain('[overflow-wrap:anywhere]');
      expect(html.match(/<h1/g)?.length).toBe(1);
    }
  });
});
