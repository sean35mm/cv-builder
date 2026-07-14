import { describe, expect, test } from 'bun:test';
import { DEFAULT_SECTIONS_ORDER } from '../lib/profile/domain';
import {
  hasContactContent,
  hasSectionContent,
  resolveCompleteSectionOrder,
  resolveVisibleSections,
} from '../lib/profile/rendering';

const emptyProfile = {
  username: 'ada',
  name: 'Ada Lovelace',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  volunteering: [],
  exhibitions: [],
  awards: [],
};

describe('profile rendering semantics', () => {
  test('ignores malformed entries, deduplicates, and appends missing defaults', () => {
    expect(
      resolveCompleteSectionOrder([
        'projects',
        null,
        'unknown',
        'bio',
        'projects',
        42,
      ])
    ).toEqual([
      'projects',
      'bio',
      ...DEFAULT_SECTIONS_ORDER.filter(
        (section) => section !== 'projects' && section !== 'bio'
      ),
    ]);
    expect(resolveCompleteSectionOrder('projects')).toEqual(
      DEFAULT_SECTIONS_ORDER
    );
  });

  test('omits empty sections and tolerates malformed collection values', () => {
    expect(resolveVisibleSections(emptyProfile)).toEqual(['header']);
    expect(
      resolveVisibleSections({ ...emptyProfile, experience: null })
    ).toEqual(['header']);
  });

  test('keeps header, bio, and contact visibility independent', () => {
    const profile = {
      ...emptyProfile,
      bio: 'First programmer.',
      email: 'ada@example.com',
      sectionsOrder: ['contact', 'header', 'bio'],
    };

    expect(hasContactContent(profile)).toBe(true);
    expect(
      resolveVisibleSections(profile, {
        sectionsVisibility: { contact: false },
      })
    ).toEqual(['header', 'bio']);
    expect(
      resolveVisibleSections(profile, {
        sectionsVisibility: { header: false },
      })
    ).toEqual(['contact', 'bio']);
  });

  test('includes non-empty projects unless the section is hidden', () => {
    const profile = {
      ...emptyProfile,
      projects: [{ id: 'notes', title: 'Notes', year: '1843' }],
      sectionsOrder: ['projects'],
    };

    expect(hasSectionContent(profile, 'projects')).toBe(true);
    expect(resolveVisibleSections(profile)).toEqual(['projects', 'header']);
    expect(
      resolveVisibleSections(profile, {
        sectionsVisibility: { projects: false },
      })
    ).toEqual(['header']);
  });

  test('uses testimonial count when resolving visible sections', () => {
    const profile = {
      ...emptyProfile,
      sectionsOrder: ['testimonials', 'header'],
    };

    expect(hasSectionContent(profile, 'testimonials', 1)).toBe(true);
    expect(resolveVisibleSections(profile)).toEqual(['header']);
    expect(resolveVisibleSections(profile, { testimonialCount: 2 })).toEqual([
      'testimonials',
      'header',
    ]);
    expect(
      resolveVisibleSections(profile, {
        sectionsVisibility: { testimonials: false },
        testimonialCount: 2,
      })
    ).toEqual(['header']);
  });
});
