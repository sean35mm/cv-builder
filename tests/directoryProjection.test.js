import { expect, test } from 'bun:test';
import {
  createDirectoryProjection,
  DIRECTORY_MAX_VISIBLE_SKILLS,
  normalizeDirectoryCursor,
  normalizeDirectoryPageSize,
  normalizeDirectoryQuery,
  normalizeDirectorySkill,
  toDirectoryProfileDto,
} from '../convex/directoryProjection';

const visibleState = {
  sectionsOrder: ['header', 'skills'],
  sectionsVisibility: {
    header: true,
    skills: true,
  },
};

const profile = {
  username: 'ada',
  name: 'Ada Lovelace',
  avatar: '/api/storage/avatar',
  title: 'Engineer',
  industry: 'Computing',
  skills: [' TypeScript ', 'typescript', 'Math'],
  projects: [{ id: 'project', images: ['/api/storage/project'] }],
  isPublic: true,
  isDirectoryListed: true,
};

test('directory projection requires both public visibility and explicit opt-in', () => {
  expect(
    createDirectoryProjection(
      { ...profile, isDirectoryListed: false },
      visibleState
    )
  ).toBeNull();
  expect(
    createDirectoryProjection(
      { ...profile, isDirectoryListed: undefined },
      visibleState
    )
  ).toBeNull();
  expect(
    createDirectoryProjection(
      { ...profile, isPublic: false, isDirectoryListed: true },
      visibleState
    )
  ).toBeNull();
  expect(createDirectoryProjection(profile, null)).toBeNull();
});

test('directory projection follows effective header and skills visibility', () => {
  const projection = createDirectoryProjection(profile, {
    ...visibleState,
    sectionsVisibility: { header: false, skills: false },
  });

  expect(projection).toEqual({
    username: 'ada',
    name: 'ada',
    skills: [],
    searchText: 'ada ada',
  });
});

test('directory DTO allowlists only public card fields', () => {
  const projection = createDirectoryProjection(profile, visibleState);
  expect(projection).not.toBeNull();
  expect(toDirectoryProfileDto(projection)).toEqual({
    username: 'ada',
    name: 'Ada Lovelace',
    title: 'Engineer',
    industry: 'Computing',
    skills: ['TypeScript', 'Math'],
  });
});

test('directory projection caps visible skills at the projection maximum', () => {
  const skills = Array.from({ length: DIRECTORY_MAX_VISIBLE_SKILLS + 5 }, (_, index) =>
    `Skill ${index}`
  );
  const projection = createDirectoryProjection(
    { ...profile, skills },
    visibleState
  );

  expect(projection).not.toBeNull();
  expect(projection.skills).toEqual(
    skills.slice(0, DIRECTORY_MAX_VISIBLE_SKILLS)
  );
});

test('directory query inputs are normalized and bounded', () => {
  expect(normalizeDirectoryQuery('  product   design  ')).toBe('product design');
  expect(normalizeDirectorySkill('  TypeScript  ')).toBe('typescript');
  expect(normalizeDirectoryPageSize(0)).toBe(1);
  expect(normalizeDirectoryPageSize(100)).toBe(24);
  expect(normalizeDirectoryPageSize(Number.NaN)).toBe(12);
  expect(normalizeDirectoryCursor('cursor')).toBe('cursor');
  expect(normalizeDirectoryCursor('x'.repeat(2_001))).toBeUndefined();
});
