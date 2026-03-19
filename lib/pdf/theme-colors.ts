/**
 * Maps theme slugs to hex color values for PDF rendering.
 * Derived from the HSL tokens in globals.css.
 */

type ThemeColors = {
  primary: string;
  foreground: string;
  muted: string;
  border: string;
};

const themes: Record<string, ThemeColors> = {
  sage: {
    primary: '#5A8A6A',
    foreground: '#2E2419',
    muted: '#8A7E6B',
    border: '#D6CEBC',
  },
  ocean: {
    primary: '#1170C4',
    foreground: '#0F1E38',
    muted: '#52648A',
    border: '#D0DAE8',
  },
  rose: {
    primary: '#CC1A66',
    foreground: '#3D1024',
    muted: '#8A5270',
    border: '#E6C2D4',
  },
  amber: {
    primary: '#E5920D',
    foreground: '#2E2010',
    muted: '#8A7042',
    border: '#D9CC9C',
  },
  slate: {
    primary: '#1B2847',
    foreground: '#1A1E26',
    muted: '#5C6370',
    border: '#D5D8DD',
  },
  sand: {
    primary: '#6B4D29',
    foreground: '#2E2619',
    muted: '#8A7A5E',
    border: '#D9D1BD',
  },
  cocoa: {
    primary: '#5C3520',
    foreground: '#2E2119',
    muted: '#8A7560',
    border: '#D9CFC4',
  },
  peach: {
    primary: '#E8702B',
    foreground: '#3D241A',
    muted: '#8A6052',
    border: '#E6CFC2',
  },
  forest: {
    primary: '#315C3B',
    foreground: '#1F3324',
    muted: '#5C7A60',
    border: '#C8D9CA',
  },
  olive: {
    primary: '#3E5C29',
    foreground: '#272E1F',
    muted: '#6B7A5C',
    border: '#D0D9C8',
  },
  teal: {
    primary: '#1A8A7A',
    foreground: '#1A2E2B',
    muted: '#527A70',
    border: '#BDD9D1',
  },
  mauve: {
    primary: '#5C3399',
    foreground: '#261A33',
    muted: '#6B5C7A',
    border: '#D0C8D9',
  },
};

const bw: ThemeColors = {
  primary: '#111111',
  foreground: '#111111',
  muted: '#6B7280',
  border: '#D1D5DB',
};

export function getThemeColors(slug?: string, themed = false): ThemeColors {
  if (!themed || !slug) return bw;
  return themes[slug] ?? bw;
}
