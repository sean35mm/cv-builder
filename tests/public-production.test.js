import { describe, expect, mock, test } from 'bun:test';
import { classifyRequestHost } from '../lib/custom-domains/host-routing';

mock.module('server-only', () => ({}));

const { getHostRoutingConfig, resolveSiteOrigin } =
  await import('../lib/custom-domains/server-config');

const read = (path) => Bun.file(new URL(`../${path}`, import.meta.url)).text();

describe('public production contracts', () => {
  test('keeps reduced-motion state out of the hydration render', async () => {
    const [hero, reveal] = await Promise.all([
      read('components/landing/hero-specimen.tsx'),
      read('components/motion/reveal.tsx'),
    ]);

    expect(reveal).toContain('export function useMounted(): boolean');
    expect(reveal).toContain('getServerSnapshot');
    expect(hero).toContain('const mounted = useMounted()');
    expect(hero).toContain(
      'const shouldReduceMotion = mounted && Boolean(reduceMotion)'
    );
    expect(hero).toContain('disabled={shouldReduceMotion}');
    expect(hero).toContain('aria-pressed={manualPaused || shouldReduceMotion}');
    expect(hero).toMatch(
      /const shouldPause = manualPaused \|\| interactionPaused \|\| shouldReduceMotion/
    );
  });

  test('selects only owned HTTPS canonical origins in production', () => {
    expect(resolveSiteOrigin(undefined, 'production')).toBe(
      'https://www.opencv.app'
    );
    expect(resolveSiteOrigin('http://localhost:3000', 'production')).toBe(
      'https://www.opencv.app'
    );
    expect(resolveSiteOrigin('https://preview.vercel.app', 'production')).toBe(
      'https://www.opencv.app'
    );
    expect(resolveSiteOrigin('https://opencv.app', 'production')).toBe(
      'https://opencv.app'
    );
    expect(resolveSiteOrigin('https://www.opencv.app', 'production')).toBe(
      'https://www.opencv.app'
    );
    expect(resolveSiteOrigin('http://localhost:4000', 'development')).toBe(
      'http://localhost:4000'
    );
    expect(resolveSiteOrigin('https://preview.example', 'development')).toBe(
      'https://preview.example'
    );
  });

  test('keeps a configured production authority routable without trusting it for SEO', () => {
    const original = {
      CUSTOM_DOMAINS_ENABLED: process.env.CUSTOM_DOMAINS_ENABLED,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      PLATFORM_HOSTS: process.env.PLATFORM_HOSTS,
    };
    try {
      process.env.CUSTOM_DOMAINS_ENABLED = 'false';
      process.env.NEXT_PUBLIC_SITE_URL = 'https://preview.example.com';
      delete process.env.PLATFORM_HOSTS;

      expect(
        resolveSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL, 'production')
      ).toBe('https://www.opencv.app');
      const config = getHostRoutingConfig();
      expect(config.platformAuthorities.has('preview.example.com')).toBe(true);
      expect(config.platformAuthorities.has('www.preview.example.com')).toBe(
        true
      );
      expect(config.platformAuthorities.has('opencv.app')).toBe(true);
      expect(config.platformAuthorities.has('www.opencv.app')).toBe(true);
      expect(config.platformAuthorities.has('unrelated.example.com')).toBe(
        false
      );
      expect(classifyRequestHost('unrelated.example.com', config).kind).toBe(
        'invalid'
      );
    } finally {
      for (const [name, value] of Object.entries(original)) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  });

  test('publishes canonical metadata, robots, public routes, and a branded icon', async () => {
    const [
      layout,
      home,
      directory,
      roadmap,
      changelog,
      privacy,
      terms,
      login,
      signup,
      sitemap,
      robots,
      icon,
    ] = await Promise.all([
      read('app/layout.tsx'),
      read('app/page.tsx'),
      read('app/directory/page.tsx'),
      read('app/roadmap/layout.tsx'),
      read('app/changelog/layout.tsx'),
      read('app/privacy/layout.tsx'),
      read('app/terms/layout.tsx'),
      read('app/login/layout.tsx'),
      read('app/signup/layout.tsx'),
      read('app/sitemap.ts'),
      read('app/robots.ts'),
      read('app/icon.svg'),
    ]);

    expect(layout).not.toContain('alternates: { canonical:');
    expect(home).toContain("alternates: { canonical: '/' }");
    expect(directory).toContain("alternates: { canonical: '/directory' }");
    expect(roadmap).toContain("alternates: { canonical: '/roadmap' }");
    expect(changelog).toContain("alternates: { canonical: '/changelog' }");
    expect(privacy).toContain("alternates: { canonical: '/privacy' }");
    expect(terms).toContain("alternates: { canonical: '/terms' }");
    expect(login).toContain('robots: { index: false, follow: false }');
    expect(signup).toContain('robots: { index: false, follow: false }');
    expect(sitemap).toContain(
      "const publicRoutes = ['/', '/directory', '/roadmap', '/changelog']"
    );
    expect(sitemap).toContain('profileCanonicalUrl(');
    expect(sitemap).toContain(
      'return Array.from(urls).map((url) => ({ url }))'
    );
    expect(robots).toContain("new URL('/sitemap.xml', siteOrigin).href");
    expect(robots).toContain("userAgent: '*', allow: '/'");
    expect(icon).toContain('viewBox="0 0 64 64"');
    expect(icon).toContain('#111216');
    expect(icon).toContain('#f4f0e6');
    expect(icon).not.toMatch(/(?:href|src)=/);
  });
});
