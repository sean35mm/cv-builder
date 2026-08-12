import { describe, expect, test } from 'bun:test';
import { selectAiProfileContext } from '../lib/ai/profile-context';
import {
  coarseDeviceCategory,
  normalizeUtmValue,
  safeReferrerHostname,
  trustedVercelCountry,
} from '../lib/analytics/privacy';
import {
  atsDocumentToText,
  createAtsDocument,
  sanitizedExportFilename,
} from '../lib/exports/ats';
import { aiWritingConfigured, analyticsDigestConfigured } from '../lib/features';
import {
  applyTranslationOverlay,
  normalizeProfileLocale,
  normalizeProfileLocales,
  normalizeTranslationOverlay,
} from '../lib/profile/locales';
import {
  ANALYTICS_RETENTION_DELETE_BATCH_SIZE,
  analyticsEventIsExpired,
  analyticsRetentionCutoff,
  analyticsRetentionDrainPolicy,
} from '../lib/analytics/retention';

describe('Phase 5 source contracts', () => {
  test('pins the approved production dependencies exactly', async () => {
    const manifest = await Bun.file(
      new URL('../package.json', import.meta.url)
    ).json();
    expect(manifest.dependencies.openai).toBe('6.48.0');
    expect(manifest.dependencies.docx).toBe('9.7.1');
  });

  test('AI and digest integrations stay disabled without every configuration value', () => {
    expect(aiWritingConfigured({})).toBe(false);
    expect(
      aiWritingConfigured({
        AI_WRITING_ENABLED: 'true',
        OPENAI_API_KEY: 'key',
        OPENAI_MODEL: 'configured-model',
      })
    ).toBe(true);
    expect(analyticsDigestConfigured({ ANALYTICS_DIGEST_ENABLED: 'true' })).toBe(
      false
    );
  });

  test('AI context omits contact, social, media, links, IDs, and hidden sections', () => {
    const result = selectAiProfileContext(
      {
        _id: 'private',
        name: 'Ada',
        email: 'ada@example.test',
        website: 'https://private.test',
        experience: [
          {
            id: 'job',
            role: 'Engineer',
            description: 'Built systems',
            contact: { email: 'nested@example.test' },
            media: [{ id: 'asset', url: 'https://media.private.test' }],
            links: [{ id: 'link', href: 'https://link.private.test' }],
            link: 'https://private.test',
            images: ['private'],
            nested: {
              id: 'nested-id',
              website: 'https://nested.private.test',
              label: 'Safe detail',
            },
          },
        ],
        skills: ['TypeScript'],
      },
      ['name', 'experience', 'skills'],
      { header: true, experience: true, skills: true }
    );
    expect(result).toEqual({
      name: 'Ada',
      experience: [
        {
          role: 'Engineer',
          description: 'Built systems',
          nested: { label: 'Safe detail' },
        },
      ],
      skills: ['TypeScript'],
    });
    expect(JSON.stringify(result)).not.toContain('private.test');
    expect(JSON.stringify(result)).not.toContain('nested-id');
  });

  test('locale overlays validate BCP-47, enforce five locales, and preserve fallback data', () => {
    expect(normalizeProfileLocale('fr_ca')).toBe('fr-CA');
    expect(() => normalizeProfileLocales(['en', 'fr', 'de', 'es', 'it', 'pt'])).toThrow();
    expect(() =>
      normalizeTranslationOverlay({
        text: { email: 'not allowed' },
        lists: {},
      })
    ).toThrow();
    const profile = {
      name: 'Ada',
      bio: 'Default bio',
      experience: [{ id: 'job', role: 'Engineer', company: 'Example' }],
      email: 'ada@example.test',
    };
    expect(
      applyTranslationOverlay(profile, {
        text: { name: 'Adèle', 'experience.job.role': 'Ingénieure' },
        lists: {},
      })
    ).toEqual({
      ...profile,
      name: 'Adèle',
      experience: [{ id: 'job', role: 'Ingénieure', company: 'Example' }],
    });
  });

  test('ATS output is deterministic, visibility-aware, and contact/media-free', () => {
    const profile = {
      username: 'ada',
      name: 'Ada Lovelace',
      title: 'Engineer',
      email: 'ada@example.test',
      avatar: '/secret',
      skills: ['TypeScript'],
      experience: [
        {
          id: 'job',
          role: 'Engineer',
          company: 'Example',
          startDate: '2024-01',
          current: true,
          description: 'Built systems',
          images: ['/secret'],
        },
      ],
    };
    const visibility = { header: true, bio: true, skills: true, experience: false };
    const first = createAtsDocument(profile, visibility, 'en');
    const second = createAtsDocument(profile, visibility, 'en');
    expect(first).toEqual(second);
    const text = atsDocumentToText(first);
    expect(text).toContain('TypeScript');
    expect(text).not.toContain('Built systems');
    expect(text).not.toContain('ada@example.test');
    expect(text).not.toContain('/secret');
    expect(sanitizedExportFilename('../../Ada Résumé', 'docx')).toBe(
      'Ada_Resume.docx'
    );
  });

  test('ATS never uses a hidden name across owner, version, public, and passcode sources', () => {
    const visibility = {
      header: false,
      bio: false,
      skills: false,
      interests: false,
    };
    const overlay = {
      text: { name: 'Translated Hidden Name', bio: 'Translated hidden bio' },
      lists: {
        skills: ['Translated hidden skill'],
        interests: ['Translated hidden interest'],
      },
    };
    const sources = {
      owner: { username: 'safe-user', name: 'Owner Hidden Name' },
      version: { username: 'safe-user', name: 'Version Hidden Name' },
      public: { username: 'safe-user', name: 'Public Hidden Name' },
      passcode: { username: 'safe-user', name: 'Passcode Hidden Name' },
    };

    for (const source of Object.values(sources)) {
      const document = createAtsDocument(source, visibility, 'fr', overlay);
      expect(document).toEqual({
        schemaVersion: 1,
        locale: 'fr',
        name: 'safe-user',
        sections: [],
      });
      expect(JSON.stringify(document)).not.toContain('Hidden');
      expect(JSON.stringify(document)).not.toContain('Translated');
    }
  });

  test('analytics retention uses exact boundaries and bounded drain scheduling', () => {
    const now = 10_000_000_000;
    const cutoff = analyticsRetentionCutoff(now);
    expect(analyticsEventIsExpired(cutoff - 1, now)).toBe(true);
    expect(analyticsEventIsExpired(cutoff, now)).toBe(false);
    expect(analyticsRetentionDrainPolicy(0).rescheduleImmediately).toBe(false);
    expect(
      analyticsRetentionDrainPolicy(ANALYTICS_RETENTION_DELETE_BATCH_SIZE - 1)
        .rescheduleImmediately
    ).toBe(false);
    expect(
      analyticsRetentionDrainPolicy(ANALYTICS_RETENTION_DELETE_BATCH_SIZE)
        .rescheduleImmediately
    ).toBe(true);
    expect(() =>
      analyticsRetentionDrainPolicy(ANALYTICS_RETENTION_DELETE_BATCH_SIZE + 1)
    ).toThrow();
  });

  test('analytics stores only normalized campaign, coarse device, host referrer, and trusted country', () => {
    expect(normalizeUtmValue(' Summer Campaign ')).toBe('summer-campaign');
    expect(normalizeUtmValue('invalid value!')).toBeUndefined();
    expect(coarseDeviceCategory('Mozilla iPhone')).toBe('mobile');
    expect(safeReferrerHostname('https://example.test/path?secret=yes')).toBe(
      'example.test'
    );
    const headers = new Headers({ 'x-vercel-ip-country': 'us' });
    expect(trustedVercelCountry(headers, undefined)).toBeUndefined();
    expect(trustedVercelCountry(headers, '1')).toBe('US');
  });

  test('embed and export routes carry restrictive source contracts', async () => {
    const embed = await Bun.file(
      new URL('../app/embed/[username]/route.ts', import.meta.url)
    ).text();
    expect(embed).toContain("default-src 'none'");
    expect(embed).toContain('frame-ancestors https: http:');
    expect(embed).toContain("'Referrer-Policy': 'no-referrer'");
    expect(embed).not.toContain('<script');
    const analytics = await Bun.file(
      new URL('../convex/analytics.ts', import.meta.url)
    ).text();
    const crons = await Bun.file(
      new URL('../convex/crons.ts', import.meta.url)
    ).text();
    const retention = await Bun.file(
      new URL('../lib/analytics/retention.ts', import.meta.url)
    ).text();
    expect(retention).toContain('90 * 24 * 60 * 60 * 1000');
    expect(analytics).toContain('.take(ANALYTICS_RETENTION_DELETE_BATCH_SIZE)');
    expect(crons).not.toContain('internal.analytics.deleteExpired');
    expect(analytics).toContain(
      'handler: async () => ({ deleted: 0, rescheduled: false })'
    );
    const ai = await Bun.file(
      new URL('../app/api/ai/route.ts', import.meta.url)
    ).text();
    expect(ai).toContain('store: false');
  });
});
