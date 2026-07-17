export const MAX_MANAGED_IMAGES_PER_ENTRY = 3;

export type ManagedMediaSection =
  | 'header'
  | 'projects'
  | 'exhibitions'
  | 'awards';

export type ManagedMediaReference = {
  storageId: string;
  canonicalUrl: string;
  section: ManagedMediaSection;
};

export type ParsedManagedMediaUrl = {
  storageId: string;
  canonicalUrl: string;
  previewToken?: string;
};

type ProfileMediaShape = {
  avatar?: string;
  projects?: Array<{ images?: string[] }>;
  exhibitions?: Array<{ images?: string[] }>;
  awards?: Array<{ images?: string[] }>;
};

type MediaAuthorization = {
  accessMode: 'private' | 'passcode' | 'unlisted' | 'public';
  authorization: 'none' | 'grant' | 'owner';
  sectionsVisibility?: Record<string, boolean>;
};

const MANAGED_MEDIA_URL_PATTERN =
  /^\/api\/storage\/([A-Za-z0-9_-]+)(?:\?token=([A-Za-z0-9_-]{48}))?$/;

export function parseManagedMediaUrl(value: string): ParsedManagedMediaUrl | null {
  const match = value.match(MANAGED_MEDIA_URL_PATTERN);
  if (!match) return null;
  const storageId = match[1];
  return {
    storageId,
    canonicalUrl: `/api/storage/${storageId}`,
    ...(match[2] ? { previewToken: match[2] } : {}),
  };
}

export function canonicalizeManagedMediaUrl(value: string): string | null {
  return parseManagedMediaUrl(value)?.canonicalUrl ?? null;
}

export function enumerateProfileManagedMedia(
  profile: ProfileMediaShape
): ManagedMediaReference[] {
  const references: ManagedMediaReference[] = [];
  const add = (value: string | undefined, section: ManagedMediaSection) => {
    if (!value) return;
    const parsed = parseManagedMediaUrl(value);
    if (parsed) references.push({ ...parsed, section });
  };

  add(profile.avatar, 'header');
  for (const project of profile.projects ?? []) {
    for (const image of project.images ?? []) add(image, 'projects');
  }
  for (const exhibition of profile.exhibitions ?? []) {
    for (const image of exhibition.images ?? []) add(image, 'exhibitions');
  }
  for (const award of profile.awards ?? []) {
    for (const image of award.images ?? []) add(image, 'awards');
  }
  return references;
}

export function dedupeManagedMediaReferences(
  references: ManagedMediaReference[]
): ManagedMediaReference[] {
  const seen = new Set<string>();
  return references.filter((reference) => {
    if (seen.has(reference.storageId)) return false;
    seen.add(reference.storageId);
    return true;
  });
}

export function managedMediaStorageIds(profile: ProfileMediaShape): Set<string> {
  return new Set(
    enumerateProfileManagedMedia(profile).map((reference) => reference.storageId)
  );
}

export function removedManagedMediaStorageIds(
  previous: ProfileMediaShape,
  next: ProfileMediaShape
): Set<string> {
  const previousIds = managedMediaStorageIds(previous);
  const nextIds = managedMediaStorageIds(next);
  return new Set([...previousIds].filter((storageId) => !nextIds.has(storageId)));
}

export function findManagedMediaReference(
  profile: ProfileMediaShape,
  storageId: string
): ManagedMediaReference | null {
  return (
    enumerateProfileManagedMedia(profile).find(
      (reference) => reference.storageId === storageId
    ) ?? null
  );
}

export function canAccessProfileManagedMedia(
  profile: ProfileMediaShape,
  storageId: string,
  authorization: MediaAuthorization
): boolean {
  return enumerateProfileManagedMedia(profile).some(
    (reference) =>
      reference.storageId === storageId &&
      canAccessManagedMediaSection(reference.section, authorization)
  );
}

export function canAccessManagedMediaSection(
  section: ManagedMediaSection,
  authorization: MediaAuthorization
): boolean {
  if (authorization.authorization === 'owner') return true;
  if (authorization.accessMode === 'private') return false;
  if (authorization.sectionsVisibility?.[section] !== true) return false;
  if (authorization.accessMode === 'passcode') {
    return authorization.authorization === 'grant';
  }
  return (
    authorization.accessMode === 'public' ||
    authorization.accessMode === 'unlisted'
  );
}
