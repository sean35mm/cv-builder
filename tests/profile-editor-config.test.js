import { describe, expect, test } from 'bun:test';

import {
  createInitialSectionsVisibility,
  getDraggableSectionOrder,
  getSectionForInvalidRoot,
  mergeDraggableSectionOrder,
} from '../components/editor/profile-editor-config';
import { SECTION_IDS } from '../lib/profile/domain';

describe('profile editor config', () => {
  test('keeps only the current draggable sections in requested order', () => {
    expect(
      getDraggableSectionOrder([
        'projects',
        'header',
        'bio',
        'experience',
        'testimonials',
        'skills',
      ])
    ).toEqual(['projects', 'experience', 'skills']);
  });

  test('reorders draggable sections without moving interspersed fixed sections', () => {
    expect(
      mergeDraggableSectionOrder(
        [
          'header',
          'experience',
          'bio',
          'education',
          'contact',
          'skills',
          'projects',
          'certifications',
          'volunteering',
          'exhibitions',
          'awards',
          'testimonials',
        ],
        [
          'awards',
          'projects',
          'skills',
          'experience',
          'education',
          'certifications',
          'volunteering',
          'exhibitions',
        ]
      )
    ).toEqual([
      'header',
      'awards',
      'bio',
      'projects',
      'contact',
      'skills',
      'experience',
      'education',
      'certifications',
      'volunteering',
      'exhibitions',
      'testimonials',
      'languages',
      'publications',
      'interests',
    ]);
  });

  test('preserves invalid-root routing priority and genuine header fallback', () => {
    expect(
      getSectionForInvalidRoot({ skills: {}, education: {}, experience: {} })
    ).toBe('experience');
    expect(getSectionForInvalidRoot({ projects: {} })).toBe('projects');
    expect(getSectionForInvalidRoot({})).toBe('header');
  });

  test('starts every known section as visible', () => {
    expect(createInitialSectionsVisibility()).toEqual(
      Object.fromEntries(SECTION_IDS.map((section) => [section, true]))
    );
  });
});
