import { describe, expect, test } from 'bun:test';
import { PUBLIC_SECTION_IDS } from '../convex/publicProfiles';
import { toPublicProfile } from '../convex/profileValidators';
import { resolveCompleteSectionOrder } from '../lib/profile/rendering';
import { resolveProfileTypography } from '../lib/profile/typography';

const profile = {
  _id: 'profile-id',
  _creationTime: 1,
  userId: 'user-id',
  username: 'alice',
  normalizedUsername: 'alice',
  name: 'Alice Real Name',
  title: 'Private title',
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
  projects: [
    {
      id: 'project-1',
      title: 'Project',
      year: '2026',
      images: ['/api/storage/image_123?token=secret-preview-token'],
    },
  ],
  certifications: [{ id: 'cert-1', name: 'Cert', issuer: 'Issuer' }],
  volunteering: [
    {
      id: 'volunteer-1',
      role: 'Volunteer',
      organization: 'Org',
      startDate: '2020-01',
      current: true,
    },
  ],
  exhibitions: [{ id: 'exhibition-1', title: 'Show', year: '2026' }],
  awards: [{ id: 'award-1', title: 'Award', issuer: 'Issuer', year: '2026' }],
  sectionsOrder: [...PUBLIC_SECTION_IDS],
  isPublic: true,
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
      'location',
      'bio',
      'email',
      'website',
      'github',
      'linkedin',
      'twitter',
      'projects',
      'certifications',
      'volunteering',
      'exhibitions',
      'awards',
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
  });

  test('canonicalizes storage images with public profile context', () => {
    const dto = toPublicProfile(profile, {
      sectionsOrder: resolveCompleteSectionOrder(profile.sectionsOrder),
      sectionsVisibility: visibility(PUBLIC_SECTION_IDS),
    });
    const image = dto.projects?.[0]?.images?.[0];

    expect(image).toBe('/api/storage/image_123?profile=alice');
    expect(image).not.toContain('token=');
    expect(image).not.toContain('secret-preview-token');
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
