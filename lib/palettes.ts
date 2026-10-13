// The six palettes shown in the app. Stored values stay valid for all twelve
// legacy IDs (convex/profileValueValidators.ts); hidden ones map to the closest.
export const PALETTES = [
  { id: 'slate', name: 'Slate', swatch: '#34445a' },
  { id: 'sand', name: 'Sand', swatch: '#8a5a2b' },
  { id: 'sage', name: 'Sage', swatch: '#3d6a44' },
  { id: 'olive', name: 'Olive', swatch: '#64631c' },
  { id: 'ocean', name: 'Ocean', swatch: '#1c5dab' },
  { id: 'rose', name: 'Rose', swatch: '#a23a4c' },
] as const;

export type PaletteId = (typeof PALETTES)[number]['id'];

export const DEFAULT_PALETTE: PaletteId = 'slate';

const LEGACY_PALETTES: Record<string, PaletteId> = {
  amber: 'sand',
  cocoa: 'sand',
  peach: 'rose',
  mauve: 'rose',
  forest: 'sage',
  teal: 'ocean',
};

export function resolvePaletteId(value: unknown): PaletteId {
  if (typeof value !== 'string') return DEFAULT_PALETTE;
  if (PALETTES.some((palette) => palette.id === value)) {
    return value as PaletteId;
  }
  return LEGACY_PALETTES[value] ?? DEFAULT_PALETTE;
}

export function paletteClassName(value: unknown): string {
  return `profile-theme theme-${resolvePaletteId(value)}`;
}
