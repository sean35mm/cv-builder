import { describe, expect, test } from 'bun:test';
import { PALETTES } from '../lib/palettes';

const css = (
  await Bun.file(new URL('../app/profile.css', import.meta.url)).text()
).replace(/\/\*[\s\S]*?\*\//g, '');

// Collects --p-* values for every `.profile-theme.theme-<id>` rule, keyed by
// `light:<id>` / `dark:<id>`. Rules without an explicit theme (print) are ignored.
const palettes = {};
for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const vars = Object.fromEntries(
    [...body.matchAll(/--p-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(([, k, v]) => [
      k,
      v,
    ])
  );
  for (const selector of selectors.split(',')) {
    const match = selector
      .trim()
      .match(/^(\.dark )?\.profile-theme\.theme-([\w-]+)$/);
    if (!match) continue;
    const key = `${match[1] ? 'dark' : 'light'}:${match[2]}`;
    palettes[key] = { ...palettes[key], ...vars };
  }
}

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('profile palettes', () => {
  for (const { id } of PALETTES) {
    for (const mode of ['light', 'dark']) {
      test(`${id} (${mode}) meets text contrast targets`, () => {
        const p = palettes[`${mode}:${id}`];
        expect(p).toBeDefined();
        expect(contrast(p.fg, p.bg)).toBeGreaterThanOrEqual(7);
        expect(contrast(p.muted, p.bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(p.accent, p.bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
