import { describe, expect, test } from 'bun:test';

import { customDomainCanonicalUrl } from '../lib/custom-domains/access-metadata';
import {
  canGenerateProfileQr,
  ogPresentationForAccessMode,
  profileShareAssetUrl,
  safeShareFileName,
} from '../lib/profile/share-assets';
import {
  createProfileJsonLd,
  serializeJsonLd,
} from '../lib/profile/structured-data';

describe('profile sharing and SEO contracts', () => {
  test('keeps OG and QR access behavior mode-specific', () => {
    expect(ogPresentationForAccessMode('public')).toBe('rich');
    expect(ogPresentationForAccessMode('unlisted')).toBe('rich');
    expect(ogPresentationForAccessMode('passcode')).toBe('protected');
    expect(ogPresentationForAccessMode('private')).toBe('denied');
    expect(canGenerateProfileQr('private')).toBe(false);
    expect(canGenerateProfileQr('passcode')).toBe(true);
  });

  test('uses same-origin canonical assets without tokens and sanitizes downloads', () => {
    const canonical = customDomainCanonicalUrl('cv.example.com');
    const qr = profileShareAssetUrl(canonical, 'ada', 'qr', 'svg');
    expect(qr).toBe(
      'https://cv.example.com/api/profile-share/qr?username=ada&format=svg'
    );
    expect(qr).not.toMatch(/token|passcode|grant/);
    expect(safeShareFileName('../Ada!', 'png')).toBe('---Ada--qr.png');
  });

  test('serializes a public-only Person object and escapes HTML-significant input', () => {
    const profile = {
      username: 'ada',
      name: 'Ada <Lovelace>',
      title: 'Engineer',
      location: 'London',
      bio: 'Computing',
      email: 'not-in-jsonld@example.com',
      website: 'https://example.com',
      github: 'ada',
      linkedin: 'javascript:alert(1)',
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
    const value = createProfileJsonLd(profile, 'https://example.com/@ada');
    const serialized = serializeJsonLd(value);
    expect(value['@type']).toBe('Person');
    expect(serialized).not.toContain('<');
    expect(serialized).not.toContain('not-in-jsonld');
    expect(value.sameAs).not.toContain('javascript:alert(1)');
  });

  test('sitemap and generated routes contain fail-closed and bounded contracts', async () => {
    const sitemap = await Bun.file(
      new URL('../app/sitemap.ts', import.meta.url)
    ).text();
    const qrRoute = await Bun.file(
      new URL('../app/api/profile-share/qr/route.ts', import.meta.url)
    ).text();
    expect(sitemap).toContain('api.directory.listSitemap');
    expect(sitemap).toContain(
      "const publicRoutes = ['/', '/directory', '/roadmap', '/changelog']"
    );
    expect(sitemap).toContain(
      'return Array.from(urls).map((url) => ({ url }))'
    );
    expect(qrRoute).toContain('resolveRequestHostBinding');
    expect(qrRoute).not.toContain('fetch(canonicalUrl');
  });
});
