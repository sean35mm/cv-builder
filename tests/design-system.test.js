import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATE_IDS, TEMPLATES } from '../lib/templates';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => Bun.file(new URL(path, import.meta.url)).text();
const platformGeometryPaths = [
  'components/app-shell.tsx',
  'components/platform/brand-lockup.tsx',
  'components/platform/page-heading.tsx',
  'components/sidebar-custom.tsx',
  'components/ui/badge.tsx',
  'components/ui/button.tsx',
  'components/ui/calendar.tsx',
  'components/ui/card.tsx',
  'components/ui/checkbox.tsx',
  'components/ui/dialog.tsx',
  'components/ui/dropdown-menu.tsx',
  'components/ui/input-otp.tsx',
  'components/ui/input.tsx',
  'components/ui/popover.tsx',
  'components/ui/separator.tsx',
  'components/ui/sheet.tsx',
  'components/ui/skeleton.tsx',
  'components/ui/textarea.tsx',
  'components/ui/toggle.tsx',
  'components/ui/tooltip.tsx',
];

async function readSources(paths) {
  return Promise.all(
    paths.map(async (path) => ({
      path,
      source: await Bun.file(join(root, path)).text(),
    }))
  );
}

function cssCustomProperties(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  if (!block) throw new Error(`Missing ${selector} CSS block`);

  return Object.fromEntries(
    [...block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(
      ([, property, value]) => [property, value.trim()]
    )
  );
}

function hslLuminance(value) {
  const [hue, saturation, lightness] = value.match(/[\d.]+/g).map(Number);
  const saturationRatio = saturation / 100;
  const lightnessRatio = lightness / 100;
  const chroma = (1 - Math.abs(2 * lightnessRatio - 1)) * saturationRatio;
  const segment = ((hue % 360) + 360) / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const [red, green, blue] =
    segment < 1
      ? [chroma, secondary, 0]
      : segment < 2
        ? [secondary, chroma, 0]
        : segment < 3
          ? [0, chroma, secondary]
          : segment < 4
            ? [0, secondary, chroma]
            : segment < 5
              ? [secondary, 0, chroma]
              : [chroma, 0, secondary];
  const offset = lightnessRatio - chroma / 2;
  const linearize = (channel) => {
    const srgb = channel + offset;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * linearize(red) +
    0.7152 * linearize(green) +
    0.0722 * linearize(blue)
  );
}

function contrastRatio(first, second) {
  const lighter = Math.max(hslLuminance(first), hslLuminance(second));
  const darker = Math.min(hslLuminance(first), hslLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

async function readUiSources() {
  const sources = [];
  for (const pattern of [
    'app/**/*.{css,ts,tsx}',
    'components/**/*.{css,ts,tsx}',
  ]) {
    const glob = new Bun.Glob(pattern);
    for await (const path of glob.scan({ cwd: root })) {
      sources.push({ path, source: await Bun.file(join(root, path)).text() });
    }
  }
  return sources;
}

async function readLandingSources() {
  const sources = [];
  const glob = new Bun.Glob('components/landing/**/*.{ts,tsx}');
  for await (const path of glob.scan({ cwd: root })) {
    sources.push({ path, source: await Bun.file(join(root, path)).text() });
  }
  return sources;
}

describe('radical redesign source contracts', () => {
  test('keeps the platform fixed while scoping all 12 profile themes', async () => {
    const [styles, shell, preview, publicRoute, hostRoute] = await Promise.all([
      read('../app/globals.css'),
      read('../components/app-shell.tsx'),
      read('../components/profile-preview.tsx'),
      read('../app/u/[username]/page.tsx'),
      read('../app/host-profile/page.tsx'),
    ]);
    const expectedThemes = [
      'sage',
      'ocean',
      'rose',
      'amber',
      'slate',
      'sand',
      'cocoa',
      'peach',
      'forest',
      'olive',
      'teal',
      'mauve',
    ];
    const lightThemes = [
      ...styles.matchAll(/^\.profile-theme\.theme-([\w-]+) \{/gm),
    ].map((match) => match[1]);
    const darkThemes = [
      ...styles.matchAll(/^\.dark \.profile-theme\.theme-([\w-]+) \{/gm),
    ].map((match) => match[1]);

    expect(lightThemes).toEqual(expectedThemes);
    expect(darkThemes).toEqual(expectedThemes);
    expect(styles).toContain(
      '/* Fixed platform tokens. Profile palettes are scoped below to .profile-theme. */'
    );
    expect(styles).toContain('.profile-theme {');
    expect(cssCustomProperties(styles, '.profile-theme')).toMatchObject({
      '--radius': '0.625rem',
    });
    expect(shell).toContain('data-platform-theme="fixed"');
    expect(shell).not.toContain('profile-theme');
    for (const source of [preview, publicRoute, hostRoute]) {
      expect(source).toContain('profile-theme');
      expect(source).toContain('theme-');
    }
  });

  test('uses Geist Sans for platform display and isolates Source Serif to profiles', async () => {
    const [layout, styles, brand, pageHeading] = await Promise.all([
      read('../app/layout.tsx'),
      read('../app/globals.css'),
      read('../components/platform/brand-lockup.tsx'),
      read('../components/platform/page-heading.tsx'),
    ]);

    expect(layout).toContain("import { GeistSans } from 'geist/font/sans'");
    expect(layout).toContain("import { GeistMono } from 'geist/font/mono'");
    expect(layout).toContain('Source_Serif_4');
    expect(layout).toContain("variable: '--font-profile-serif'");
    expect(styles).toContain('--font-sans: var(--font-geist-sans)');
    expect(styles).toContain('--font-serif: var(--font-profile-serif)');
    expect(styles).toContain('--font-display: var(--font-geist-sans)');
    expect(styles).toContain(
      ".profile-typography[data-body-font='serif'] {\n  font-family: var(--font-profile-serif);"
    );
    expect(styles).toContain(
      ".profile-typography[data-heading-font='serif'] :is(h1, h2, h3) {\n  font-family: var(--font-profile-serif) !important;"
    );
    expect(brand).toContain('font-display');
    expect(pageHeading).toContain('font-display');
  });

  test('uses the flat workspace chrome and approved IA', async () => {
    const [shell, navigation] = await Promise.all([
      read('../components/app-shell.tsx'),
      read('../components/sidebar-custom.tsx'),
    ]);

    expect(shell).not.toContain('md:pl-60');
    expect(navigation).toContain('fixed inset-x-0 top-0');
    expect(navigation).toContain('border-b border-border bg-background');
    expect(navigation).not.toContain('bg-[#111216]');
    expect(navigation).toContain('aria-label="Workspace"');
    expect(navigation).toContain('fixed inset-x-0 bottom-0');
    expect(navigation).toContain('border-t border-border');
    expect(navigation).toContain('md:hidden');
    expect(navigation).toContain('aria-label="Mobile workspace"');
    for (const label of [
      'Home',
      'Profile',
      'Appearance',
      'Publish',
      'Activity',
      'Explore',
    ]) {
      expect(navigation).toContain(`label: '${label}'`);
    }
  });

  test('gates analytics data and directory branding on workspace readiness', async () => {
    const [analytics, directoryPage, directoryLoading, directoryError] =
      await Promise.all([
        read('../app/analytics/page.tsx'),
        read('../app/directory/page.tsx'),
        read('../app/directory/loading.tsx'),
        read('../app/directory/error.tsx'),
      ]);

    expect(analytics).toContain(
      "const analyticsArgs = loggedInUser && profile ? { days } : 'skip'"
    );
    expect(analytics).toContain("router.replace('/')");
    expect(analytics).toContain('if (!profile) return <ActivityNoProfile />');

    for (const source of [directoryPage, directoryLoading, directoryError]) {
      expect(source).toContain(
        'group-data-[workspace-chrome=true]/app-shell:hidden'
      );
    }
    expect(directoryError).toContain('onClick={reset}');
  });

  test('keeps the landing anchored to the product and username claim', async () => {
    const [
      page,
      landingPage,
      hero,
      specimen,
      features,
      usernameClaim,
      landingSources,
    ] = await Promise.all([
      read('../app/page.tsx'),
      read('../app/landing-page-client.tsx'),
      read('../components/landing/hero.tsx'),
      read('../components/landing/hero-specimen.tsx'),
      read('../components/landing/features.tsx'),
      read('../components/landing/username-claim.tsx'),
      readLandingSources(),
    ]);
    const landingSource = landingSources.map(({ source }) => source).join('\n');

    expect(page).toContain("alternates: { canonical: '/' }");
    expect(landingPage).toContain('href="#landing-main"');
    expect(landingPage).toContain('id="landing-main"');
    expect(landingPage.indexOf('href="#landing-main"')).toBeLessThan(
      landingPage.indexOf('<header')
    );
    expect(landingPage.indexOf('<Footer />')).toBeGreaterThan(
      landingPage.indexOf('</main>')
    );
    for (const [label, href] of [
      ['Directory', '/directory'],
      ['Changelog', '/changelog'],
      ['Roadmap', '/roadmap'],
      ['Home', '/home'],
    ]) {
      expect(landingPage).toContain(label);
      expect(landingPage).toContain(href);
    }
    expect(landingPage).toContain('Sign in');
    expect(landingPage).toContain('Claim your address');
    expect(landingPage).toContain('hidden sm:inline-flex');
    for (const label of ['Browse profiles', 'Privacy', 'Terms']) {
      expect(landingSource).toContain(label);
    }
    expect(landingPage).toMatch(
      /<Button[^>]*asChild[^>]*>[\s\S]*?<Link href="\/home">Home<\/Link>[\s\S]*?<\/Button>/
    );
    expect(landingPage).not.toMatch(/HowItWorks|how-it-works/);
    expect(hero).toContain('UsernameClaim');
    expect(hero).toContain('HeroSpecimen');
    expect(hero).not.toContain('whitespace-nowrap');
    expect(landingSource).not.toContain('font-serif');
    expect(landingSource).not.toContain('—');
    expect(landingSource).not.toContain('app-screenshot');
    expect(features).not.toMatch(/kicker/i);
    expect(features).not.toMatch(/(['"`])0[123]\1/);

    expect(specimen).toContain('useReducedMotion');
    expect(specimen).toMatch(
      /if \(shouldPause\) return;[\s\S]*window\.setInterval/
    );
    expect(specimen).toContain("'Pause preview'");
    expect(specimen).toContain("'Resume preview'");
    expect(specimen).toContain("'Preview paused'");
    expect(specimen).toContain('inert');
    expect(specimen).toContain('aria-hidden="true"');
    expect(specimen).toContain('role="region"');
    expect(specimen).toContain('aria-label="Profile template preview"');
    expect(
      (specimen.match(/aria-pressed=/g) ?? []).length
    ).toBeGreaterThanOrEqual(2);
    expect(specimen).toContain(
      "import { TEMPLATES, type TemplateId } from '@/lib/templates'"
    );
    expect(specimen).not.toContain('linear-gradient');
    expect(specimen).not.toContain('transition-all');

    for (const marker of [
      'function normalize(raw: string)',
      '/^[a-z0-9_]{3,15}$/.test(u)',
      'api.profiles.checkUsernameAvailable',
      ": 'skip'",
      'maxLength={15}',
      "sessionStorage.setItem('desiredUsername', username)",
      'onClaim();',
      'aria-live="polite"',
    ]) {
      expect(usernameClaim).toContain(marker);
    }
  });

  test('removes legacy platform helpers and numbered page headings', async () => {
    const [sources, pageHeading] = await Promise.all([
      readUiSources(),
      read('../components/platform/page-heading.tsx'),
    ]);
    const legacyPlatformHelper =
      /platform-(?:grid|page|kicker|title|section-title|rule|control)/;

    for (const { path, source } of sources) {
      expect(source, path).not.toMatch(legacyPlatformHelper);
      const pageHeadingTags = source.match(/<PageHeading\b[\s\S]*?\/>/g) ?? [];
      for (const tag of pageHeadingTags) {
        expect(tag, path).not.toMatch(/\bindex=/);
      }
    }
    expect(pageHeading).toMatch(/\bkicker\??\s*:/);
  });

  test('locks the foundation palette, radius, and surface geometry', async () => {
    const [
      styles,
      layout,
      badge,
      button,
      input,
      card,
      dialog,
      sheet,
      platformSources,
    ] = await Promise.all([
      read('../app/globals.css'),
      read('../app/layout.tsx'),
      read('../components/ui/badge.tsx'),
      read('../components/ui/button.tsx'),
      read('../components/ui/input.tsx'),
      read('../components/ui/card.tsx'),
      read('../components/ui/dialog.tsx'),
      read('../components/ui/sheet.tsx'),
      readSources(platformGeometryPaths),
    ]);

    expect(cssCustomProperties(styles, ':root')).toMatchObject({
      '--radius': '0.25rem',
      '--background': '220 20% 98%',
      '--foreground': '222 24% 12%',
      '--card': '0 0% 100%',
      '--card-foreground': '222 24% 12%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '222 24% 12%',
      '--primary': '222 24% 12%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '220 18% 94%',
      '--secondary-foreground': '222 20% 18%',
      '--muted': '220 18% 94%',
      '--muted-foreground': '220 9% 40%',
      '--accent': '224 76% 48%',
      '--accent-foreground': '0 0% 100%',
      '--destructive': '0 72% 45%',
      '--destructive-foreground': '0 0% 100%',
      '--border': '220 14% 84%',
      '--input': '220 14% 78%',
      '--ring': '224 76% 48%',
      '--sidebar': '220 20% 98%',
      '--sidebar-foreground': '222 24% 12%',
      '--sidebar-primary': '224 76% 48%',
      '--sidebar-primary-foreground': '0 0% 100%',
      '--sidebar-accent': '220 18% 94%',
      '--sidebar-accent-foreground': '222 20% 18%',
      '--sidebar-border': '220 14% 84%',
      '--sidebar-ring': '224 76% 48%',
    });
    expect(cssCustomProperties(styles, '.dark')).toMatchObject({
      '--background': '222 22% 9%',
      '--foreground': '220 18% 93%',
      '--card': '222 18% 12%',
      '--card-foreground': '220 18% 93%',
      '--popover': '222 18% 12%',
      '--popover-foreground': '220 18% 93%',
      '--primary': '220 18% 93%',
      '--primary-foreground': '222 22% 9%',
      '--secondary': '222 14% 17%',
      '--secondary-foreground': '220 18% 93%',
      '--muted': '222 14% 17%',
      '--muted-foreground': '220 10% 68%',
      '--accent': '217 91% 65%',
      '--accent-foreground': '222 24% 12%',
      '--destructive': '0 80% 65%',
      '--destructive-foreground': '222 22% 9%',
      '--border': '220 12% 24%',
      '--input': '220 12% 32%',
      '--ring': '217 91% 65%',
      '--sidebar': '222 22% 9%',
      '--sidebar-foreground': '220 18% 93%',
      '--sidebar-primary': '217 91% 65%',
      '--sidebar-primary-foreground': '222 24% 12%',
      '--sidebar-accent': '222 14% 17%',
      '--sidebar-accent-foreground': '220 18% 93%',
      '--sidebar-border': '220 12% 24%',
      '--sidebar-ring': '217 91% 65%',
    });
    expect(layout).toContain(
      "{ media: '(prefers-color-scheme: light)', color: '#F9FAFB' }"
    );
    expect(layout).toContain(
      "{ media: '(prefers-color-scheme: dark)', color: '#12151C' }"
    );
    expect(button).toContain('whitespace-nowrap rounded text-sm');
    expect(badge).toContain(
      'border-border text-foreground [a&]:hover:bg-secondary'
    );
    expect(input).toContain('min-w-0 rounded border border-input');
    expect(card).toContain('rounded-lg border border-border');
    expect(dialog).toContain('rounded-lg border border-border');
    expect(sheet).toContain('rounded-none border-l');
    expect(sheet).toContain('rounded-none border-t');

    const oversizedRadius = /\brounded-(?:xl|2xl|3xl|\[[^\]\s]+\])/g;
    const elevatedShadow = /\bshadow-(?!none\b)[^\s"'`]+/g;
    const hardcodedHex = /#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})\b/gi;
    for (const { path, source } of platformSources) {
      expect(source.match(oversizedRadius) ?? [], path).toEqual([]);
      expect(source.match(elevatedShadow) ?? [], path).toEqual([]);
      expect(source.match(hardcodedHex) ?? [], path).toEqual([]);
    }
  });

  test('keeps generic glass and gradient effects out of the platform and workspace surfaces', async () => {
    const sources = await readUiSources();
    const prohibitedEffect = /gradient|backdrop-blur|\bglass\b/i;
    // The landing header may use a translucent backdrop blur. The exemption
    // still leaves every platform UI primitive and workspace surface covered.
    const isLandingSurface = (path) =>
      path === 'app/page.tsx' ||
      path === 'app/landing-page-client.tsx' ||
      path.startsWith('components/landing/');

    for (const { path, source } of sources) {
      if (isLandingSurface(path)) continue;
      expect(source, path).not.toMatch(prohibitedEffect);
    }
  });

  test('retains visible focus, reduced motion, and 44px controls', async () => {
    const [styles, button, input, navigation] = await Promise.all([
      read('../app/globals.css'),
      read('../components/ui/button.tsx'),
      read('../components/ui/input.tsx'),
      read('../components/sidebar-custom.tsx'),
    ]);

    expect(styles).toContain(':focus-visible');
    expect(styles).toContain('outline: 2px solid hsl(var(--ring))');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).toContain('transition-duration: 0.01ms !important');
    expect(button).toContain("default: 'h-11");
    expect(button).toContain("icon: 'size-11'");
    expect(input).toContain('flex h-11 w-full');
    expect(navigation).toContain('min-h-11 min-w-11');
  });

  test('keeps mobile editor and roadmap controls safe and keyboard accessible', async () => {
    const [editor, roadmap] = await Promise.all([
      read('../components/profile-editor.tsx'),
      read('../components/roadmap/roadmap-filters.tsx'),
    ]);

    expect(editor).toContain(
      'bottom-[calc(3.5rem+env(safe-area-inset-bottom))]'
    );
    expect(editor).toContain('pb-[calc(1rem+env(safe-area-inset-bottom))]');
    expect(roadmap).toContain('overflow-x-auto');
    expect(roadmap).toContain("case 'ArrowRight':");
    expect(roadmap).toContain("case 'ArrowLeft':");
    expect(roadmap).toContain("case 'Home':");
    expect(roadmap).toContain("case 'End':");
    expect(roadmap).toContain('tabIndex={isActive ? 0 : -1}');
    expect(roadmap).toContain('scrollIntoView({');
    expect(roadmap).toContain('window.matchMedia(');
    expect(roadmap).toContain("'(prefers-reduced-motion: reduce)'");
    expect(roadmap).toContain("behavior: reduceMotion ? 'auto' : 'smooth'");
    expect(roadmap.indexOf('window.matchMedia(')).toBeGreaterThan(
      roadmap.indexOf('useEffect(() => {')
    );
    expect(roadmap).toContain('min-h-11');
    expect(roadmap).toContain('aria-hidden="true"');
  });

  test('keeps corrected profile primary pairs at WCAG AA contrast', async () => {
    const styles = await read('../app/globals.css');
    const pairs = [
      ['.profile-theme.theme-amber', '38 92% 50%', '26 30% 10%'],
      ['.profile-theme.theme-peach', '18 90% 60%', '20 20% 12%'],
      ['.profile-theme.theme-teal', '180 60% 32.2%', '0 0% 100%'],
      ['.dark .profile-theme.theme-mauve', '270 40% 60%', '270 12% 11%'],
    ];

    for (const [selector, primary, foreground] of pairs) {
      const properties = cssCustomProperties(styles, selector);
      expect(properties['--primary']).toBe(primary);
      expect(properties['--primary-foreground']).toBe(foreground);
      expect(properties['--sidebar-primary']).toBe(primary);
      expect(properties['--sidebar-primary-foreground']).toBe(foreground);
      expect(
        contrastRatio(primary, foreground),
        selector
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('keeps stable template IDs and maps them to selector radios', async () => {
    const selector = await read(
      '../components/templates/template-selector.tsx'
    );

    expect(TEMPLATE_IDS).toEqual([
      'classic',
      'modern',
      'minimal',
      'developer',
      'creative',
    ]);
    expect(TEMPLATES.map((template) => template.name)).toEqual([
      'Standard',
      'Stream',
      'Focus',
      'Build',
      'Studio',
    ]);
    expect(new Set(TEMPLATES.map((template) => template.name)).size).toBe(5);
    for (const marker of [
      'TEMPLATES.map((template) => {',
      'type="radio"',
      'value={template.id}',
      'useMutation(api.profiles.updateTemplate)',
      'await updateTemplate({ templateId })',
      'onTemplateChange?.(templateId)',
    ]) {
      expect(selector).toContain(marker);
    }
    expect(selector).not.toContain('TemplatePreview');
    expect(selector).not.toContain('Best for');
  });

  test('uses restrained functional interaction timing', async () => {
    const [button, toggle, popover, dropdown, tooltip] = await Promise.all([
      read('../components/ui/button.tsx'),
      read('../components/ui/toggle.tsx'),
      read('../components/ui/popover.tsx'),
      read('../components/ui/dropdown-menu.tsx'),
      read('../components/ui/tooltip.tsx'),
    ]);
    const strongEaseOut = 'duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]';

    for (const source of [button, toggle]) {
      expect(source).toContain('enabled:active:scale-[0.97]');
      expect(source).toContain(strongEaseOut);
    }
    expect(popover).toContain(
      'origin-(--radix-popover-content-transform-origin)'
    );
    expect(popover).toContain(strongEaseOut);
    expect(
      dropdown.match(
        /origin-\(--radix-dropdown-menu-content-transform-origin\)/g
      ) ?? []
    ).toHaveLength(2);
    expect(dropdown.match(/duration-150/g) ?? []).toHaveLength(2);
    expect(tooltip).toContain('delayDuration = 300');
    expect(tooltip).toContain('skipDelayDuration = 100');

    for (const source of [button, toggle, popover, dropdown, tooltip]) {
      expect(source).not.toMatch(/\b(?:transition-all|ease-in|scale-0)\b/);
    }
  });

  test('retains redirects from legacy appearance routes', async () => {
    const [themeRoute, templatesRoute] = await Promise.all([
      read('../app/theme/page.tsx'),
      read('../app/templates/page.tsx'),
    ]);

    expect(themeRoute).toContain("redirect('/appearance')");
    expect(templatesRoute).toContain("redirect('/appearance')");
  });
});
