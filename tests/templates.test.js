import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProfileDocument } from '../components/profile/profile-document';
import {
  DEFAULT_TEMPLATE,
  getTemplate,
  resolveTemplateId,
  TEMPLATE_IDS,
  TEMPLATES,
} from '../lib/templates';

const OFFERED = ['classic', 'modern', 'minimal'];

const emptyProfile = {
  username: 'ada',
  name: 'Ada Lovelace',
  experience: [],
  education: [],
  skills: [],
  languages: [],
  projects: [],
  publications: [],
  certifications: [],
  volunteering: [],
  exhibitions: [],
  awards: [],
  interests: [],
};

const fullProfile = {
  ...emptyProfile,
  avatar: '/api/storage/avatar?profile=ada',
  title: 'Analyst',
  location: 'London',
  bio: 'First programmer.',
  email: 'ada@example.com',
  website: 'ada.example.com',
  github: 'ada',
  linkedin: 'ada-lovelace',
  twitter: '@ada',
  experience: [
    {
      id: 'e1',
      role: 'Analyst',
      company: 'Analytical Engine',
      startDate: '1842-01',
      current: true,
      description: 'Wrote the notes.',
    },
    // Start date only: must not leave a dangling dash.
    {
      id: 'e2',
      role: 'Translator',
      company: '',
      startDate: '1840-03',
      current: false,
    },
  ],
  education: [
    {
      id: 'd1',
      degree: 'Mathematics',
      school: 'Private tutors',
      startDate: '1830-01',
      endDate: '1835-01',
      current: false,
    },
  ],
  skills: ['Mathematics', 'Poetical science'],
  languages: [
    { id: 'l1', name: 'English', proficiency: 'native' },
    { id: 'l2', name: 'French' },
  ],
  projects: [
    {
      id: 'p1',
      title: 'Note G',
      year: '1843',
      link: 'https://example.com/note-g',
      technologies: ['Punch cards'],
      images: ['/api/storage/p1?profile=ada', '/api/storage/p2?profile=ada'],
      isFeatured: true,
    },
    { id: 'p2', title: 'Flyology', year: '1828', link: 'javascript:alert(1)' },
  ],
  publications: [
    {
      id: 'pub',
      title: 'Sketch of the Analytical Engine',
      publisher: 'Taylor',
    },
  ],
  certifications: [{ id: 'c1', name: 'Royal Society', issuer: 'RS' }],
  volunteering: [
    {
      id: 'v1',
      role: 'Tutor',
      organization: 'School',
      startDate: '1840-01',
      current: true,
    },
  ],
  exhibitions: [
    {
      id: 'x1',
      title: 'Engine Show',
      year: '1843',
      images: ['/api/storage/show?profile=ada'],
    },
  ],
  awards: [
    { id: 'a1', title: 'Mathematics Prize', issuer: 'Society', year: '1843' },
  ],
  interests: ['Horses', 'Music'],
};

const SECTION_HEADINGS = [
  'Experience',
  'Education',
  'Skills',
  'Languages',
  'Projects',
  'Publications',
  'Certifications',
  'Volunteering',
  'Exhibitions',
  'Awards',
  'Interests',
];

const render = (props) =>
  renderToStaticMarkup(createElement(ProfileDocument, props));
const h2s = (html) =>
  [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((match) => match[1]);

describe('template catalog', () => {
  test('offers three templates and keeps every stored ID valid', () => {
    expect(TEMPLATES.map((template) => template.id)).toEqual(OFFERED);
    expect(TEMPLATE_IDS).toEqual([...OFFERED, 'developer', 'creative']);
  });

  test('maps retired and unknown IDs to an offered template', () => {
    expect(DEFAULT_TEMPLATE).toBe('classic');
    expect(resolveTemplateId('developer')).toBe('minimal');
    expect(resolveTemplateId('creative')).toBe('modern');
    for (const value of [undefined, null, 42, 'ClassicTemplate', 'legacy']) {
      expect(resolveTemplateId(value)).toBe('classic');
    }
    for (const id of OFFERED) expect(getTemplate(id).id).toBe(id);
  });
});

describe('ProfileDocument', () => {
  test('renders the resolved template inside a palette-scoped container', () => {
    const html = render({
      profile: emptyProfile,
      templateId: 'developer',
      colorTheme: 'teal',
    });
    expect(html).toContain('data-template="minimal"');
    expect(html).toContain('theme-ocean');
    expect(html).toMatch(/class="[^"]*@container/);
  });

  for (const templateId of OFFERED) {
    describe(templateId, () => {
      test('renders every section of a full profile', () => {
        const html = render({ profile: fullProfile, templateId });
        expect(html.match(/<h1/g)?.length).toBe(1);
        expect(html).toContain('Ada Lovelace');
        for (const heading of SECTION_HEADINGS) {
          expect(h2s(html)).toContain(heading);
        }
        expect(html).toContain('First programmer.');
        expect(html).toContain('<time dateTime="1842-01"');
        expect(html).toContain('href="mailto:ada@example.com"');
        expect(html).toContain('href="https://github.com/ada"');
        expect(html).toContain('href="https://x.com/ada"');
        expect(html).toContain('alt="Note G, image 1 of 2"');
        expect(html).toContain('alt="Engine Show"');
        expect(html).toContain('alt="Ada Lovelace, portrait"');
        expect(html).not.toContain('javascript:');
        expect(html).not.toContain('Testimonials');
        // No dangling range separator after a start-only date.
        expect(html).not.toMatch(/\u2013\u2009<\//);
      });

      test('renders a near-empty profile without empty sections', () => {
        const html = render({
          profile: {
            ...emptyProfile,
            bio: '  ',
            skills: [''],
            interests: [' '],
          },
          templateId,
        });
        expect(html.match(/<h1/g)?.length).toBe(1);
        expect(html).toContain('Ada Lovelace');
        expect(h2s(html)).toEqual([]);
        expect(html).not.toContain('<ul');
        expect(html).not.toContain('<img');
      });

      test('follows sectionsOrder and sectionsVisibility', () => {
        const html = render({
          profile: { ...fullProfile, sectionsOrder: ['awards', 'education'] },
          templateId,
          sectionsVisibility: { experience: false, contact: false },
        });
        const headings = h2s(html);
        expect(headings.indexOf('Awards')).toBeLessThan(
          headings.indexOf('Education')
        );
        expect(headings).not.toContain('Experience');
        expect(html).not.toContain('mailto:');
      });

      test('renders approved testimonials in order and respects visibility', () => {
        const testimonials = [
          {
            _id: 't1',
            authorName: 'Charles Babbage',
            authorTitle: 'Inventor',
            authorCompany: 'Difference Engine',
            relationship: 'Collaborator',
            content: 'Enchantress of numbers.',
          },
          // Blank text must not leave an empty quote or heading.
          {
            _id: 't2',
            authorName: 'Nobody',
            relationship: 'Unknown',
            content: '  ',
          },
        ];
        const html = render({
          profile: {
            ...fullProfile,
            sectionsOrder: ['testimonials', 'experience'],
          },
          templateId,
          testimonials,
        });
        const headings = h2s(html);
        expect(headings.indexOf('Testimonials')).toBeLessThan(
          headings.indexOf('Experience')
        );
        expect(html).toContain('Enchantress of numbers.');
        expect(html).toContain('Inventor, Difference Engine · Collaborator');
        expect(html).not.toContain('Nobody');

        for (const hidden of [
          render({
            profile: fullProfile,
            templateId,
            testimonials,
            sectionsVisibility: { testimonials: false },
          }),
          render({
            profile: emptyProfile,
            templateId,
            testimonials: [testimonials[1]],
          }),
        ]) {
          expect(h2s(hidden)).not.toContain('Testimonials');
          expect(hidden).not.toContain('<blockquote');
        }
      });

      test('keeps one sr-only h1 when the header is hidden', () => {
        const html = render({
          profile: { ...emptyProfile, name: 'ada', title: 'Hidden title' },
          templateId,
          sectionsVisibility: { header: false },
        });
        expect(html.match(/<h1/g)?.length).toBe(1);
        expect(html).toContain('<h1 class="sr-only">ada</h1>');
        expect(html).not.toContain('Hidden title');
      });
    });
  }
});
