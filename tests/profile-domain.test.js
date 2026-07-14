import { describe, expect, test } from 'bun:test';
import { DEFAULT_SECTIONS_ORDER, SECTION_IDS } from '../lib/profile/domain';
import {
  createEmptyAwardEntry,
  createEmptyCertificationEntry,
  createEmptyEducationEntry,
  createEmptyExhibitionEntry,
  createEmptyExperienceEntry,
  createEmptyProjectEntry,
  createEmptyVolunteeringEntry,
  resolveSectionsOrder,
} from '../lib/profile/editor';

describe('profile domain', () => {
  test('defines a complete default section order', () => {
    expect(DEFAULT_SECTIONS_ORDER).toEqual(SECTION_IDS);
    expect(new Set(DEFAULT_SECTIONS_ORDER).size).toBe(SECTION_IDS.length);
  });

  test('tolerantly resolves unknown, duplicate, and incomplete orders', () => {
    expect(resolveSectionsOrder(['projects', 'unknown', 'projects'])).toEqual([
      'projects',
      ...DEFAULT_SECTIONS_ORDER.filter((section) => section !== 'projects'),
    ]);
  });

  test('creates deterministic empty entries from caller-provided IDs', () => {
    const factories = [
      createEmptyExperienceEntry,
      createEmptyEducationEntry,
      createEmptyProjectEntry,
      createEmptyCertificationEntry,
      createEmptyVolunteeringEntry,
      createEmptyExhibitionEntry,
      createEmptyAwardEntry,
    ];

    for (const factory of factories) {
      expect(factory('entry-id')).toEqual(factory('entry-id'));
      expect(factory('entry-id').id).toBe('entry-id');
    }
  });
});
