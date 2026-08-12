import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  resolveOptionalProfileCollections,
  resolveUpdateProfileCompatibility,
} from '../convex/profiles';
import { updateProfileArgsValidatorFields } from '../convex/profileValueValidators';

const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('production rollout compatibility', () => {
  test('accepts legacy update payloads and preserves newer stored collections', () => {
    for (const field of [
      'avatar',
      'industry',
      'languages',
      'publications',
      'interests',
    ]) {
      expect(updateProfileArgsValidatorFields[field].isOptional).toBe(
        'optional'
      );
    }
    expect(updateProfileArgsValidatorFields.languages.kind).toBe('array');

    const stored = {
      languages: [{ id: 'language-1', name: 'French', proficiency: 'fluent' }],
      publications: [{ id: 'publication-1', title: 'Existing publication' }],
      interests: ['Accessibility'],
    };

    expect(resolveOptionalProfileCollections({}, stored)).toEqual(stored);
    expect(resolveOptionalProfileCollections({}, {})).toEqual({
      languages: [],
      publications: [],
      interests: [],
    });
  });

  test('normalizes collections supplied by current update payloads', () => {
    expect(
      resolveOptionalProfileCollections(
        {
          languages: [{ id: 'language-2', name: ' Spanish ' }],
          publications: [{ id: 'publication-2', title: ' New work ' }],
          interests: [' Design ', 'design'],
        },
        {}
      )
    ).toEqual({
      languages: [
        { id: 'language-2', name: 'Spanish', proficiency: undefined },
      ],
      publications: [
        {
          id: 'publication-2',
          title: 'New work',
          publisher: undefined,
          date: undefined,
          url: undefined,
          authors: undefined,
          description: undefined,
        },
      ],
      interests: ['Design'],
    });
  });

  test('preserves legacy-only scalar and nested additions by stable entry ID', () => {
    const compatibility = resolveUpdateProfileCompatibility(
      {
        projects: [{ id: 'project-1', title: 'Edited', year: '2026' }],
        exhibitions: [{ id: 'exhibition-1', title: 'Edited', year: '2026' }],
        awards: [
          { id: 'award-1', title: 'Edited', issuer: 'Issuer', year: '2026' },
        ],
        isPublic: true,
      },
      {
        avatar: '/api/storage/avatar',
        industry: 'Design',
        projects: [
          {
            id: 'project-1',
            title: 'Stored',
            year: '2025',
            images: ['/api/storage/project'],
            technologies: ['TypeScript'],
            category: 'Web',
            isFeatured: true,
          },
        ],
        exhibitions: [
          {
            id: 'exhibition-1',
            title: 'Stored',
            year: '2025',
            images: ['/api/storage/exhibition'],
          },
        ],
        awards: [
          {
            id: 'award-1',
            title: 'Stored',
            issuer: 'Issuer',
            year: '2025',
            images: ['/api/storage/award'],
          },
        ],
        isPublic: true,
        isDirectoryListed: false,
        accessMode: 'unlisted',
      }
    );

    expect(compatibility.avatar).toBe('/api/storage/avatar');
    expect(compatibility.industry).toBe('Design');
    expect(compatibility.projects[0]).toMatchObject({
      title: 'Edited',
      images: ['/api/storage/project'],
      technologies: ['TypeScript'],
      category: 'Web',
      isFeatured: true,
    });
    expect(compatibility.exhibitions[0].images).toEqual([
      '/api/storage/exhibition',
    ]);
    expect(compatibility.awards[0].images).toEqual(['/api/storage/award']);
  });

  test('preserves passcode protection on legacy and current ordinary saves', () => {
    const stored = {
      projects: [],
      exhibitions: [],
      awards: [],
      isPublic: false,
      isDirectoryListed: false,
      accessMode: 'passcode',
    };
    const legacySave = resolveUpdateProfileCompatibility(
      { projects: [], exhibitions: [], awards: [], isPublic: false },
      stored
    );
    const currentSave = resolveUpdateProfileCompatibility(
      {
        languages: [],
        publications: [],
        interests: [],
        projects: [],
        exhibitions: [],
        awards: [],
        isPublic: false,
        isDirectoryListed: false,
      },
      stored
    );

    expect(legacySave.isLegacyPayload).toBe(true);
    expect(legacySave.accessMode).toBe('passcode');
    expect(currentSave.isLegacyPayload).toBe(false);
    expect(currentSave.accessMode).toBe('passcode');
  });

  test('maps a non-passcode legacy public privacy downgrade to private', () => {
    const stored = {
      projects: [],
      exhibitions: [],
      awards: [],
      isPublic: true,
      isDirectoryListed: true,
      accessMode: 'public',
    };
    const legacyPrivate = resolveUpdateProfileCompatibility(
      { projects: [], exhibitions: [], awards: [], isPublic: false },
      stored
    );

    expect(legacyPrivate.accessMode).toBe('private');
  });

  test('does not schedule automatic analytics retention deletion', () => {
    const crons = source('convex/crons.ts');
    const analytics = source('convex/analytics.ts');

    expect(crons).not.toContain('delete expired analytics');
    expect(crons).not.toContain('internal.analytics.deleteExpired');
    expect(analytics).toContain('export const deleteExpired');
    expect(analytics).toContain('export const deleteExpiredManually');
    const disabledEntry = analytics.slice(
      analytics.indexOf('export const deleteExpired'),
      analytics.indexOf('export const deleteExpiredManually')
    );
    expect(disabledEntry).not.toContain('ctx.db.delete');
    expect(disabledEntry).not.toContain('scheduler.runAfter');
  });

  test('exposes legacy and current query contracts without weakening ownership', () => {
    const messages = source('convex/messages.ts');
    const analytics = source('convex/analytics.ts');
    const versions = source('convex/versions.ts');

    expect(messages).toContain('paginationOpts: v.optional');
    expect(messages).toContain('export const getMessagesPaginated');
    expect(messages).toContain('await messages.take(100)');
    expect(analytics).toContain('export const getReferrersReport');
    expect(analytics).toContain('export const getGeography');
    expect(analytics).toContain('export const getLinkClicks');
    expect(analytics).toContain('totalLinkClicks: v.number()');
    expect(versions).toContain('export const getVersionDetails');
    expect(versions).toContain('version.profileId !== profile._id');
  });
});
