export type ProfileAccessMode = 'private' | 'passcode' | 'unlisted' | 'public';

export type ProfileAuthorization = 'none' | 'grant' | 'owner';

export type ProfileAccessFlags = {
  isPublic: boolean;
  isDirectoryListed: boolean;
};

export type ProfileRobotsPolicy = {
  index: boolean;
  follow: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
};

export type ProfileCapabilities = {
  view: boolean;
  contact: boolean;
  analytics: boolean;
  pdf: boolean;
  images: boolean;
  testimonials: boolean;
  directory: boolean;
  index: boolean;
};

export type ProfileGrantState = {
  grantProfileId: string;
  profileId: string;
  grantAccessVersion: number;
  profileAccessVersion: number;
  expiresAt: number;
  now: number;
  mode: ProfileAccessMode;
  deleting?: boolean;
  hasPresentation?: boolean;
};

export const PROFILE_ACCESS_MODES: readonly ProfileAccessMode[] = [
  'private',
  'passcode',
  'unlisted',
  'public',
];

export const isProfileAccessMode = (
  value: unknown
): value is ProfileAccessMode =>
  typeof value === 'string' &&
  PROFILE_ACCESS_MODES.includes(value as ProfileAccessMode);

export const resolveProfileAccessMode = (
  isPublic: boolean | undefined,
  isDirectoryListed: boolean | undefined,
  accessMode?: unknown
): ProfileAccessMode => {
  if (isProfileAccessMode(accessMode)) return accessMode;
  if (isPublic !== true) return 'private';
  return isDirectoryListed === true ? 'public' : 'unlisted';
};

export const getProfileAccessFlags = (
  mode: ProfileAccessMode
): ProfileAccessFlags => ({
  isPublic: mode === 'unlisted' || mode === 'public',
  isDirectoryListed: mode === 'public',
});

export const isProfilePubliclyAccessible = (
  mode: ProfileAccessMode
): boolean => mode === 'unlisted' || mode === 'public';

export const requiresProfileGrant = (mode: ProfileAccessMode): boolean =>
  mode === 'passcode';

export const canAccessProfile = (
  mode: ProfileAccessMode,
  authorization: ProfileAuthorization
): boolean =>
  authorization === 'owner' ||
  isProfilePubliclyAccessible(mode) ||
  (mode === 'passcode' && authorization === 'grant');

export const getProfileCapabilities = (
  mode: ProfileAccessMode,
  authorization: ProfileAuthorization = 'none'
): ProfileCapabilities => {
  const view = canAccessProfile(mode, authorization);
  return {
    view,
    contact: view,
    analytics: view,
    pdf: view,
    images: view,
    testimonials: view,
    directory: mode === 'public',
    index: mode === 'public',
  };
};

export const isProfileGrantValid = (state: ProfileGrantState): boolean =>
  state.mode === 'passcode' &&
  !state.deleting &&
  state.hasPresentation !== false &&
  state.grantProfileId === state.profileId &&
  state.grantAccessVersion === state.profileAccessVersion &&
  state.expiresAt > state.now;

export const isProfileDirectoryDiscoverable = (
  mode: ProfileAccessMode
): boolean => mode === 'public';

export const isProfileIndexable = (mode: ProfileAccessMode): boolean =>
  mode === 'public';

export const getProfileRobotsPolicy = (
  mode: ProfileAccessMode
): ProfileRobotsPolicy =>
  isProfileIndexable(mode)
    ? { index: true, follow: true }
    : { index: false, follow: false, noarchive: true, nosnippet: true };
