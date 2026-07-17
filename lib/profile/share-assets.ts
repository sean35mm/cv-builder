import type { ProfileAccessMode } from './access';

export const ogPresentationForAccessMode = (
  mode: ProfileAccessMode
): 'rich' | 'protected' | 'denied' => {
  if (mode === 'public' || mode === 'unlisted') return 'rich';
  return mode === 'passcode' ? 'protected' : 'denied';
};

export const canGenerateProfileQr = (mode: ProfileAccessMode): boolean =>
  mode !== 'private';

export const profileShareAssetUrl = (
  canonicalUrl: string,
  username: string,
  asset: 'og' | 'qr',
  format?: 'png' | 'svg'
): string => {
  const url = new URL(`/api/profile-share/${asset}`, canonicalUrl);
  url.searchParams.set('username', username);
  if (format) url.searchParams.set('format', format);
  return url.toString();
};

export const safeShareFileName = (username: string, extension: 'png' | 'svg') =>
  `${username.replace(/[^a-z0-9_-]/gi, '-').slice(0, 60) || 'profile'}-qr.${extension}`;
