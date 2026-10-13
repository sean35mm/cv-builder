import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldErrors, Resolver } from 'react-hook-form';
import type { z } from 'zod';

import type { ProfileUpdateInput } from '@/lib/profile/domain';
import {
  getProfileAccessFlags,
  resolveProfileAccessMode,
  type ProfileAccessMode,
} from '@/lib/profile/access';
import {
  isBlankAward,
  isBlankCertification,
  isBlankEducation,
  isBlankExhibition,
  isBlankExperience,
  isBlankLanguage,
  isBlankProject,
  isBlankPublication,
  isBlankVolunteering,
  toMutationPayload,
  type ProfileUpdateFormValues,
} from '@/lib/profile/editor';
import { parseManagedMediaUrl } from '@/lib/profile/media';

type FormSchema = z.ZodType<ProfileUpdateFormValues, ProfileUpdateFormValues>;

// Blank entries are drafts the user has not started yet. They stay in the
// form but are never validated, previewed, or sent to the server.
const BLANK_ENTRY = {
  experience: isBlankExperience,
  education: isBlankEducation,
  languages: isBlankLanguage,
  projects: isBlankProject,
  publications: isBlankPublication,
  certifications: isBlankCertification,
  volunteering: isBlankVolunteering,
  exhibitions: isBlankExhibition,
  awards: isBlankAward,
} as const;

export type EntrySection = keyof typeof BLANK_ENTRY;

export const ENTRY_SECTIONS = Object.keys(BLANK_ENTRY) as EntrySection[];

// For each entry section, the form index of every entry that was kept.
export type KeptIndexes = Record<EntrySection, number[]>;

export function stripBlankEntries(values: ProfileUpdateFormValues): {
  values: ProfileUpdateFormValues;
  kept: KeptIndexes;
} {
  const next = { ...values };
  const kept = {} as KeptIndexes;
  for (const section of ENTRY_SECTIONS) {
    const isBlank = BLANK_ENTRY[section] as (entry: unknown) => boolean;
    const entries = (values[section] ?? []) as unknown[];
    kept[section] = [];
    const filtered = entries.filter((entry, index) => {
      if (isBlank(entry)) return false;
      kept[section].push(index);
      return true;
    });
    (next as Record<EntrySection, unknown[]>)[section] = filtered;
  }
  return { values: next, kept };
}

// Point errors for stripped arrays back at the entry's index in the form.
export function remapEntryErrors(
  errors: FieldErrors<ProfileUpdateFormValues>,
  kept: KeptIndexes
): FieldErrors<ProfileUpdateFormValues> {
  const next: Record<string, unknown> = { ...errors };
  for (const section of ENTRY_SECTIONS) {
    const sectionErrors = errors[section];
    if (!Array.isArray(sectionErrors)) continue;
    const remapped: unknown[] = [];
    sectionErrors.forEach((error, index) => {
      if (error) remapped[kept[section][index]] = error;
    });
    const root = (sectionErrors as { root?: unknown }).root;
    if (root) Object.assign(remapped, { root });
    next[section] = remapped;
  }
  return next;
}

// Friendlier copy for zod's built-in limit messages; schema messages win.
export const formErrorMap: z.core.$ZodErrorMap = (issue) => {
  if (issue.code === 'too_big' && issue.origin === 'string') {
    return `Use ${String(issue.maximum)} characters or fewer`;
  }
  if (issue.code === 'too_big' && issue.origin === 'array') {
    return `Up to ${String(issue.maximum)} items`;
  }
  if (issue.code === 'too_small' && issue.origin === 'string') {
    return 'Required';
  }
  return undefined;
};

export function createDraftResolver(
  schema: FormSchema
): Resolver<ProfileUpdateFormValues> {
  const resolve = zodResolver(schema, { error: formErrorMap });
  return async (values, context, options) => {
    const stripped = stripBlankEntries(values);
    const result = await resolve(stripped.values, context, options);
    const hasErrors = Object.keys(result.errors).length > 0;
    return hasErrors
      ? { values: {}, errors: remapEntryErrors(result.errors, stripped.kept) }
      : { values, errors: {} };
  };
}

type ContentPayload = Omit<
  ProfileUpdateInput,
  'isPublic' | 'isDirectoryListed'
>;

export type Draft =
  | { ok: true; payload: ContentPayload; key: string }
  | { ok: false; invalidCount: number };

// Validate the form the way the server will, and build the content payload.
// Access flags are deliberately excluded: they never come from form state.
export function prepareDraft(
  values: ProfileUpdateFormValues,
  schema: FormSchema
): Draft {
  const stripped = stripBlankEntries(values).values;
  const result = schema.safeParse(stripped, { error: formErrorMap });
  if (!result.success) {
    const paths = new Set(
      result.error.issues.map((issue) => issue.path.join('.'))
    );
    return { ok: false, invalidCount: paths.size };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isPublic, isDirectoryListed, ...payload } =
    toMutationPayload(stripped);
  return { ok: true, payload, key: JSON.stringify(payload) };
}

export type LiveAccessProfile = {
  isPublic: boolean;
  isDirectoryListed?: boolean;
  accessMode?: ProfileAccessMode;
};

// The access mode currently on the server, unless an access change the
// server has accepted is still on its way back through the live query.
export function buildSavePayload(
  payload: ContentPayload,
  live: LiveAccessProfile,
  pendingAccessMode?: ProfileAccessMode | null
): ProfileUpdateInput {
  const mode =
    pendingAccessMode ??
    resolveProfileAccessMode(
      live.isPublic,
      live.isDirectoryListed,
      live.accessMode
    );
  return { ...payload, ...getProfileAccessFlags(mode) };
}

// Upload URLs carry a one-time preview token. Once a save has attached them
// to the profile, the server only accepts the canonical URL.
export function collectSavedImageTokens(
  payload: ContentPayload
): Map<string, string> {
  const urls = [
    payload.avatar,
    ...payload.projects.flatMap((entry) => entry.images ?? []),
    ...payload.exhibitions.flatMap((entry) => entry.images ?? []),
    ...payload.awards.flatMap((entry) => entry.images ?? []),
  ];
  const tokens = new Map<string, string>();
  for (const url of urls) {
    const parsed = url ? parseManagedMediaUrl(url) : null;
    if (url && parsed?.previewToken) tokens.set(url, parsed.canonicalUrl);
  }
  return tokens;
}
