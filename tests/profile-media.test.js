import { describe, expect, test } from 'bun:test';
import {
  canAccessManagedMediaSection,
  canAccessProfileManagedMedia,
  canonicalizeManagedMediaUrl,
  dedupeManagedMediaReferences,
  enumerateProfileManagedMedia,
  parseManagedMediaUrl,
  removedManagedMediaStorageIds,
} from '../lib/profile/media';

const token = 'a'.repeat(48);

describe('managed profile media policy', () => {
  test('strictly parses canonical and temporary managed URLs', () => {
    expect(parseManagedMediaUrl('/api/storage/image_1')).toEqual({
      storageId: 'image_1',
      canonicalUrl: '/api/storage/image_1',
    });
    expect(parseManagedMediaUrl(`/api/storage/image_1?token=${token}`)).toEqual({
      storageId: 'image_1',
      canonicalUrl: '/api/storage/image_1',
      previewToken: token,
    });
    expect(canonicalizeManagedMediaUrl(`/api/storage/image_1?token=${token}`)).toBe(
      '/api/storage/image_1'
    );

    for (const value of [
      'https://example.com/image.png',
      'data:image/png;base64,abc',
      '/api/storage/image.svg',
      '/api/storage/image_1?profile=alice',
      `/api/storage/image_1?token=${token}&extra=1`,
      `/api/storage/image_1?token=${token}#fragment`,
      '/api/storage/image_1?token=short',
      '//api/storage/image_1',
    ]) {
      expect(parseManagedMediaUrl(value)).toBeNull();
    }
  });

  test('enumerates every managed field with section ownership and deduplicates', () => {
    const references = enumerateProfileManagedMedia({
      avatar: '/api/storage/avatar',
      projects: [{ images: ['/api/storage/shared', 'https://legacy.example/img'] }],
      exhibitions: [{ images: ['/api/storage/shared'] }],
      awards: [{ images: [`/api/storage/award?token=${token}`] }],
    });

    expect(references.map(({ storageId, section }) => [storageId, section])).toEqual([
      ['avatar', 'header'],
      ['shared', 'projects'],
      ['shared', 'exhibitions'],
      ['award', 'awards'],
    ]);
    expect(dedupeManagedMediaReferences(references).map((ref) => ref.storageId)).toEqual([
      'avatar',
      'shared',
      'award',
    ]);
  });

  test('preserves shared and moved references while identifying removals', () => {
    const previous = {
      avatar: '/api/storage/avatar',
      projects: [{ images: ['/api/storage/shared', '/api/storage/removed'] }],
      exhibitions: [{ images: ['/api/storage/shared'] }],
    };
    const next = {
      exhibitions: [{ images: ['/api/storage/avatar'] }],
      awards: [{ images: ['/api/storage/shared'] }],
    };
    expect([...removedManagedMediaStorageIds(previous, next)]).toEqual(['removed']);
  });

  test('requires section visibility for visitors and grants for passcode media', () => {
    const visible = { header: true, exhibitions: true };
    expect(
      canAccessManagedMediaSection('exhibitions', {
        accessMode: 'public',
        authorization: 'none',
        sectionsVisibility: visible,
      })
    ).toBe(true);
    expect(
      canAccessManagedMediaSection('awards', {
        accessMode: 'unlisted',
        authorization: 'none',
        sectionsVisibility: visible,
      })
    ).toBe(false);
    expect(
      canAccessManagedMediaSection('exhibitions', {
        accessMode: 'passcode',
        authorization: 'none',
        sectionsVisibility: visible,
      })
    ).toBe(false);
    expect(
      canAccessManagedMediaSection('exhibitions', {
        accessMode: 'passcode',
        authorization: 'grant',
        sectionsVisibility: visible,
      })
    ).toBe(true);
    expect(
      canAccessManagedMediaSection('awards', {
        accessMode: 'private',
        authorization: 'owner',
        sectionsVisibility: {},
      })
    ).toBe(true);
    expect(
      canAccessProfileManagedMedia(
        {
          projects: [{ images: ['/api/storage/shared'] }],
          awards: [{ images: ['/api/storage/shared'] }],
        },
        'shared',
        {
          accessMode: 'public',
          authorization: 'none',
          sectionsVisibility: { projects: false, awards: true },
        }
      )
    ).toBe(true);
  });
});
