import { describe, expect, test } from 'bun:test';

const read = (path) => Bun.file(new URL(path, import.meta.url)).text();

describe('Phase 6 Working Folio source contracts', () => {
  test('keeps platform tokens fixed and profile palettes explicitly scoped', async () => {
    const [styles, shell, preview, publicRoute, hostRoute] = await Promise.all([
      read('../app/globals.css'),
      read('../components/app-shell.tsx'),
      read('../components/profile-preview.tsx'),
      read('../app/u/[username]/page.tsx'),
      read('../app/host-profile/page.tsx'),
    ]);

    expect(styles).toContain('Fixed platform tokens');
    expect(styles).toContain('.profile-theme.theme-sage');
    expect(styles).toContain('.dark .profile-theme.theme-sage');
    expect(styles).toContain('.profile-theme {');
    expect(shell).toContain('data-platform-theme="fixed"');
    expect(shell).not.toContain('profile-theme');
    for (const source of [preview, publicRoute, hostRoute]) {
      expect(source).toContain('profile-theme');
      expect(source).toContain('theme-');
    }
  });

  test('uses the shared folio identity in landing and workspace headings', async () => {
    const brandTargets = [
      '../app/page.tsx',
      '../app/login/page.tsx',
      '../app/signup/page.tsx',
      '../app/directory/page.tsx',
      '../components/sidebar-custom.tsx',
    ];
    const headingTargets = [
      '../app/analytics/page.tsx',
      '../app/inbox/page.tsx',
      '../app/testimonials/page.tsx',
      '../app/theme/page.tsx',
      '../app/templates/page.tsx',
      '../app/domains/page.tsx',
    ];

    for (const target of brandTargets) {
      expect(await read(target)).toContain('BrandLockup');
    }
    for (const target of headingTargets) {
      expect(await read(target)).toContain('PageHeading');
    }
  });

  test('keeps generic effects out of platform, landing, and workspace targets', async () => {
    const targets = [
      '../app/page.tsx',
      '../app/analytics/page.tsx',
      '../app/inbox/page.tsx',
      '../app/testimonials/page.tsx',
      '../app/theme/page.tsx',
      '../app/templates/page.tsx',
      '../app/domains/page.tsx',
      '../components/app-shell.tsx',
      '../components/sidebar-custom.tsx',
      '../components/profile-editor.tsx',
      '../components/landing/hero.tsx',
      '../components/landing/features.tsx',
      '../components/landing/how-it-works.tsx',
      '../components/landing/username-claim.tsx',
      '../components/landing/closing-cta.tsx',
      '../components/landing/footer.tsx',
      '../components/editor/section-experience.tsx',
      '../components/editor/section-education.tsx',
      '../components/editor/project-entry-row.tsx',
      '../components/editor/section-certifications.tsx',
      '../components/editor/section-volunteering.tsx',
      '../components/editor/section-exhibitions.tsx',
      '../components/editor/section-awards.tsx',
    ];
    const prohibited =
      /gradient|backdrop-blur|rounded-xl|shadow-xl|dot-grid|glass/i;

    for (const target of targets) {
      expect(await read(target)).not.toMatch(prohibited);
    }
  });

  test('retains visible focus and reduced-motion foundations', async () => {
    const styles = await read('../app/globals.css');
    expect(styles).toContain(':focus-visible');
    expect(styles).toContain('outline: 2px solid hsl(var(--ring))');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).toContain('transition-duration: 0.01ms !important');
    expect(styles).toContain('min-height: 44px');
  });
});
