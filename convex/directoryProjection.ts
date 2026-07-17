import type { EffectivePublicProfileState } from './publicProfiles';
import {
  isProfileDirectoryDiscoverable,
  resolveProfileAccessMode,
} from '../lib/profile/access';

export const DIRECTORY_PAGE_SIZE = 12;
export const DIRECTORY_MAX_PAGE_SIZE = 24;
export const DIRECTORY_MAX_QUERY_LENGTH = 80;
export const DIRECTORY_MAX_SKILL_LENGTH = 50;
export const DIRECTORY_MAX_VISIBLE_SKILLS = 50;
export const DIRECTORY_MAX_CURSOR_LENGTH = 2_000;

export type DirectoryProjection = {
  username: string;
  name: string;
  title?: string;
  industry?: string;
  skills: string[];
  searchText: string;
};

export type DirectoryProfileDto = Omit<DirectoryProjection, 'searchText'>;

type DirectoryProfileSource = {
  username: string;
  name: string;
  title?: string;
  industry?: string;
  skills: string[];
  isPublic: boolean;
  isDirectoryListed?: boolean;
  accessMode?: unknown;
};

const normalizeWhitespace = (value: string): string =>
  value.trim().replace(/\s+/g, ' ');

export const normalizeDirectorySkill = (
  value: string | undefined
): string | undefined => {
  if (!value) return undefined;
  const normalized = normalizeWhitespace(value)
    .toLocaleLowerCase()
    .slice(0, DIRECTORY_MAX_SKILL_LENGTH);
  return normalized || undefined;
};

export const normalizeDirectoryQuery = (
  value: string | undefined
): string | undefined => {
  if (!value) return undefined;
  const normalized = normalizeWhitespace(value).slice(0, DIRECTORY_MAX_QUERY_LENGTH);
  return normalized || undefined;
};

export const normalizeDirectoryPageSize = (value: number | undefined): number => {
  if (!Number.isFinite(value)) return DIRECTORY_PAGE_SIZE;
  return Math.min(
    DIRECTORY_MAX_PAGE_SIZE,
    Math.max(1, Math.floor(value ?? DIRECTORY_PAGE_SIZE))
  );
};

export const normalizeDirectoryCursor = (
  value: string | undefined
): string | undefined =>
  value && value.length <= DIRECTORY_MAX_CURSOR_LENGTH ? value : undefined;

export const createDirectoryProjection = (
  profile: DirectoryProfileSource,
  state: EffectivePublicProfileState | null
): DirectoryProjection | null => {
  const accessMode = resolveProfileAccessMode(
    profile.isPublic,
    profile.isDirectoryListed,
    profile.accessMode
  );
  if (!isProfileDirectoryDiscoverable(accessMode) || !state) {
    return null;
  }

  const headerVisible = state.sectionsVisibility.header;
  const skillsVisible = state.sectionsVisibility.skills;
  const seenSkillKeys = new Set<string>();
  const skills = skillsVisible
    ? profile.skills
        .map((skill) => normalizeWhitespace(skill))
        .filter((skill) => {
           if (!skill || seenSkillKeys.has(skill.toLocaleLowerCase())) return false;
           seenSkillKeys.add(skill.toLocaleLowerCase());
           return true;
         })
        .slice(0, DIRECTORY_MAX_VISIBLE_SKILLS)
    : [];
  const name = headerVisible ? profile.name : profile.username;
  const title = headerVisible ? profile.title : undefined;
  const industry = headerVisible ? profile.industry : undefined;
  const searchText = [name, profile.username, title, industry, ...skills]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLocaleLowerCase();

  return {
    username: profile.username,
    name,
    ...(title ? { title } : {}),
    ...(industry ? { industry } : {}),
    skills,
    searchText,
  };
};

export const toDirectoryProfileDto = (
  projection: DirectoryProjection
): DirectoryProfileDto => ({
  username: projection.username,
  name: projection.name,
  ...(projection.title ? { title: projection.title } : {}),
  ...(projection.industry ? { industry: projection.industry } : {}),
  skills: projection.skills,
});
