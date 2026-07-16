export const PROFILE_FONT_IDS = ['default', 'sans', 'serif', 'mono'] as const;

export type ProfileFontId = (typeof PROFILE_FONT_IDS)[number];

export const PROFILE_FONT_OPTIONS = [
  { id: 'default', label: 'Template Default' },
  { id: 'sans', label: 'Modern Sans' },
  { id: 'serif', label: 'Editorial Serif' },
  { id: 'mono', label: 'Technical Mono' },
] as const satisfies ReadonlyArray<{ id: ProfileFontId; label: string }>;

export const DEFAULT_PROFILE_TYPOGRAPHY = {
  headingFont: 'default',
  bodyFont: 'default',
} as const satisfies { headingFont: ProfileFontId; bodyFont: ProfileFontId };

export type ProfileTypography = {
  headingFont: ProfileFontId;
  bodyFont: ProfileFontId;
};

export function resolveProfileFontId(value: unknown): ProfileFontId {
  return PROFILE_FONT_IDS.includes(value as ProfileFontId)
    ? (value as ProfileFontId)
    : 'default';
}

export function resolveProfileTypography(value?: {
  headingFont?: unknown;
  bodyFont?: unknown;
}): ProfileTypography {
  return {
    headingFont: resolveProfileFontId(value?.headingFont),
    bodyFont: resolveProfileFontId(value?.bodyFont),
  };
}

export function getProfileTypographyAttributes(value?: {
  headingFont?: unknown;
  bodyFont?: unknown;
}) {
  const typography = resolveProfileTypography(value);

  return {
    className: 'profile-typography',
    ...(typography.headingFont === 'default'
      ? {}
      : { 'data-heading-font': typography.headingFont }),
    ...(typography.bodyFont === 'default'
      ? {}
      : { 'data-body-font': typography.bodyFont }),
  };
}

export function getPdfFontFamily(value: unknown) {
  switch (resolveProfileFontId(value)) {
    case 'serif':
      return { regular: 'Times-Roman', bold: 'Times-Bold' };
    case 'mono':
      return { regular: 'Courier', bold: 'Courier-Bold' };
    case 'sans':
    case 'default':
    default:
      return { regular: 'Helvetica', bold: 'Helvetica-Bold' };
  }
}
