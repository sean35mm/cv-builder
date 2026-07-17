import { describe, expect, test } from 'bun:test';

describe('Phase 4 source contracts', () => {
  test('pins the approved parser and QR production dependencies exactly', async () => {
    const manifest = await Bun.file(
      new URL('../package.json', import.meta.url)
    ).json();
    expect(manifest.dependencies.fflate).toBe('0.8.3');
    expect(manifest.dependencies.papaparse).toBe('5.5.4');
    expect(manifest.dependencies.qrcode).toBe('1.5.4');
  });

  test('all templates and canonical PDF renderer include the new sections', async () => {
    const files = [
      '../components/templates/classic-view.tsx',
      '../components/templates/modern-view.tsx',
      '../components/templates/minimal-view.tsx',
      '../components/templates/developer-view.tsx',
      '../components/templates/creative-view.tsx',
      '../components/profile-preview.tsx',
      '../lib/pdf/resume-document.tsx',
    ];
    for (const file of files) {
      const source = await Bun.file(new URL(file, import.meta.url)).text();
      expect(source).toContain('languages');
      expect(source).toContain('publications');
      expect(source).toContain('interests');
    }
  });

  test('the directory projection remains free of new section content', async () => {
    const source = await Bun.file(
      new URL('../convex/directoryProjection.ts', import.meta.url)
    ).text();
    expect(source).not.toContain('publications');
    expect(source).not.toContain('languages');
    expect(source).not.toContain('interests');
  });
});
