import { describe, expect, test } from 'bun:test';
import { PUBLIC_SECTION_IDS } from '../convex/publicProfiles';
import {
  toAuthorizedProfile,
  toPublicProfile,
} from '../convex/profileValidators';
import { applyTranslationOverlay } from '../lib/profile/locales';
import { resolveCompleteSectionOrder } from '../lib/profile/rendering';
import { resolveProfileTypography } from '../lib/profile/typography';

const profile = {
  _id: 'profile-id',
  _creationTime: 1,
  userId: 'user-id',
  username: 'alice',
  normalizedUsername: 'alice',
  name: 'Alice Real Name',
  avatar: `/api/storage/avatar?token=${'a'.repeat(48)}`,
  title: 'Private title',
  industry: 'Private industry',
  location: 'Private location',
  bio: 'Private bio',
  email: 'private@example.com',
  website: 'https://private.example.com',
  github: 'private-github',
  linkedin: 'private-linkedin',
  twitter: 'private-twitter',
  headingFont: 'serif',
  bodyFont: 'mono',
  templateId: 'developer',
  experience: [
    {
      id: 'experience-1',
      role: 'Engineer',
      company: 'Private Co',
      startDate: '2020-01',
      current: true,
    },
  ],
  education: [
    {
      id: 'education-1',
      degree: 'Degree',
      school: 'Private School',
      startDate: '2016-01',
      current: false,
    },
  ],
  skills: ['Private skill'],
  languages: [{ id: 'language', name: 'English', proficiency: 'native' }],
  projects: [
    {
      id: 'project-1',
      title: 'Project',
      year: '2026',
      images: [`/api/storage/image_123?token=${'b'.repeat(48)}`],
    },
  ],
  certifications: [{ id: 'cert-1', name: 'Cert', issuer: 'Issuer' }],
  publications: [{ id: 'publication', title: 'Private paper' }],
  volunteering: [
    {
      id: 'volunteer-1',
      role: 'Volunteer',
      organization: 'Org',
      startDate: '2020-01',
      current: true,
    },
  ],
  exhibitions: [
    {
      id: 'exhibition-1',
      title: 'Show',
      year: '2026',
      images: [`/api/storage/exhibition?token=${'c'.repeat(48)}`],
    },
  ],
  awards: [
    {
      id: 'award-1',
      title: 'Award',
      issuer: 'Issuer',
      year: '2026',
      images: [`/api/storage/award?token=${'d'.repeat(48)}`],
    },
  ],
  interests: ['Private interest'],
  sectionsOrder: [...PUBLIC_SECTION_IDS],
  isPublic: true,
  isDirectoryListed: false,
};

const visibility = (visibleSections) =>
  Object.fromEntries(
    PUBLIC_SECTION_IDS.map((section) => [
      section,
      visibleSections.includes(section),
    ])
  );

describe('public profile projection', () => {
  test('resolves section order and appends missing public sections', () => {
    expect(
      resolveCompleteSectionOrder(['projects', 'unknown', 'bio', 'projects'])
    ).toEqual([
      'projects',
      'bio',
      ...PUBLIC_SECTION_IDS.filter(
        (section) => section !== 'projects' && section !== 'bio'
      ),
    ]);
  });

  test('redacts hidden header, contact, bio, and content sections', () => {
    const dto = toPublicProfile(profile, {
      sectionsOrder: resolveCompleteSectionOrder(profile.sectionsOrder),
      sectionsVisibility: visibility([]),
    });

    expect(dto.name).toBe('alice');
    for (const field of [
      'title',
      'avatar',
      'industry',
      'location',
      'bio',
      'email',
      'website',
      'github',
      'linkedin',
      'twitter',
      'projects',
      'languages',
      'publications',
      'certifications',
      'volunteering',
      'exhibitions',
      'awards',
      'interests',
    ]) {
      expect(Object.hasOwn(dto, field)).toBe(false);
    }
    expect(dto.experience).toEqual([]);
    expect(dto.education).toEqual([]);
    expect(dto.skills).toEqual([]);
    expect(Object.hasOwn(dto, 'userId')).toBe(false);
    expect(dto.headingFont).toBe('serif');
    expect(dto.bodyFont).toBe('mono');
    expect(dto.templateId).toBe('developer');
    expect(dto.accessMode).toBe('unlisted');
    expect(Object.hasOwn(dto, 'isPublic')).toBe(false);
    expect(Object.hasOwn(dto, 'isDirectoryListed')).toBe(false);
  });

  test('projects localized base data so overlays cannot restore hidden fields', () => {
    const overlay = {
      text: { name: 'Adèle', bio: 'Biographie traduite' },
      lists: {
        skills: ['Compétence traduite'],
        interests: ['Intérêt traduit'],
      },
    };
    const localized = applyTranslationOverlay(profile, overlay);
    const hiddenState = {
      sectionsOrder: resolveCompleteSectionOrder(profile.sectionsOrder),
      sectionsVisibility: visibility([]),
    };

    for (const dto of [
      toPublicProfile(localized, hiddenState),
      toAuthorizedProfile(
        { ...localized, accessMode: 'passcode' },
        hiddenState
      ),
    ]) {
      expect(dto.name).toBe('alice');
      expect(Object.hasOwn(dto, 'bio')).toBe(false);
      expect(dto.skills).toEqual([]);
      expect(Object.hasOwn(dto, 'interests')).toBe(false);
      expect(JSON.stringify(dto)).not.toContain('tradu');
    }

    const visible = toPublicProfile(localized, {
      ...hiddenState,
      sectionsVisibility: visibility(['header', 'bio', 'skills', 'interests']),
    });
    expect(visible.name).toBe('Adèle');
    expect(visible.bio).toBe('Biographie traduite');
    expect(visible.skills).toEqual(['Compétence traduite']);
    expect(visible.interests).toEqual(['Intérêt traduit']);
  });

  test('emits only unlisted or public access modes', () => {
    const state = {
      sectionsOrder: resolveCompleteSectionOrder(profile.sectionsOrder),
      sectionsVisibility: visibility(PUBLIC_SECTION_IDS),
    };

    expect(toPublicProfile(profile, state).accessMode).toBe('unlisted');
    expect(
      toPublicProfile({ ...profile, isDirectoryListed: true }, state).accessMode
    ).toBe('public');
    expect(() =>
      toPublicProfile({ ...profile, isPublic: false }, state)
    ).toThrow('Private profile cannot be projected publicly');
    expect(() =>
      toPublicProfile({ ...profile, accessMode: 'passcode' }, state)
    ).toThrow('Private profile cannot be projected publicly');
  });

  test('canonicalizes storage images with public profile context', () => {
    const dto = toPublicProfile(profile, {
      sectionsOrder: resolveCompleteSectionOrder(profile.sectionsOrder),
      sectionsVisibility: visibility(PUBLIC_SECTION_IDS),
    });
    const image = dto.projects?.[0]?.images?.[0];

    expect(image).toBe('/api/storage/image_123?profile=alice');
    expect(image).not.toContain('token=');
    expect(dto.avatar).toBe('/api/storage/avatar?profile=alice');
    expect(dto.exhibitions?.[0]?.images?.[0]).toBe(
      '/api/storage/exhibition?profile=alice'
    );
    expect(dto.awards?.[0]?.images?.[0]).toBe(
      '/api/storage/award?profile=alice'
    );
  });

  test('normalizes invalid and missing persisted typography for owner and public responses', () => {
    expect(
      resolveProfileTypography({
        headingFont: 'uploaded-font',
        bodyFont: undefined,
      })
    ).toEqual({ headingFont: 'default', bodyFont: 'default' });

    const invalidTypographyDto = toPublicProfile(
      { ...profile, headingFont: 'uploaded-font', bodyFont: undefined },
      {
        sectionsOrder: resolveCompleteSectionOrder(profile.sectionsOrder),
        sectionsVisibility: visibility(PUBLIC_SECTION_IDS),
      }
    );
    const missingTypographyDto = toPublicProfile(
      { ...profile, headingFont: undefined, bodyFont: undefined },
      {
        sectionsOrder: resolveCompleteSectionOrder(profile.sectionsOrder),
        sectionsVisibility: visibility(PUBLIC_SECTION_IDS),
      }
    );

    expect(invalidTypographyDto.headingFont).toBe('default');
    expect(invalidTypographyDto.bodyFont).toBe('default');
    expect(missingTypographyDto.headingFont).toBe('default');
    expect(missingTypographyDto.bodyFont).toBe('default');
  });
});
