import { describe, expect, test } from 'bun:test';
import {
  createEmptyAwardEntry,
  createEmptyCertificationEntry,
  createEmptyEducationEntry,
  createEmptyExhibitionEntry,
  createEmptyExperienceEntry,
  createEmptyLanguageEntry,
  createEmptyProjectEntry,
  createEmptyPublicationEntry,
  createEmptyVolunteeringEntry,
  fromMutationPayload,
  isBlankAward,
  isBlankCertification,
  isBlankEducation,
  isBlankExhibition,
  isBlankExperience,
  isBlankLanguage,
  isBlankProject,
  isBlankPublication,
  isBlankVolunteering,
  resolveSectionsOrder,
  toFormValues,
  toMutationPayload,
  toPreviewProfile,
  toProfileContent,
} from '../lib/profile/editor';
import { resolveProfileAccessMode } from '../lib/profile/access';

const profile = {
  username: 'ada',
  name: 'Ada Lovelace',
  title: 'Engineer',
  industry: 'Computing',
  experience: [
    {
      id: 'experience-1',
      role: 'Engineer',
      company: 'Analytical Engines',
      startDate: '1842-01',
      current: true,
    },
  ],
  education: [
    {
      id: 'education-1',
      degree: 'Mathematics',
      school: 'Home studies',
      startDate: '1830-01',
      endDate: '1835-01',
      current: false,
    },
  ],
  skills: ['Mathematics'],
  projects: [
    {
      id: 'project-1',
      title: 'Notes',
      year: '1843',
    },
  ],
  certifications: [],
  volunteering: [],
  exhibitions: [],
  awards: [],
  sectionsOrder: ['projects', 'header'],
  isPublic: true,
};

describe('profile editor mappers', () => {
  test('maps document, form, payload, and preview values without losing content', () => {
    const form = toFormValues(profile);
    const payload = toMutationPayload(form);
    const restored = fromMutationPayload(payload);
    const content = toProfileContent(profile);
    const preview = toPreviewProfile(profile, form);

    expect(form.experience[0].endDate).toBe('');
    expect(form.projects[0].images).toEqual([]);
    expect(payload.experience[0].endDate).toBeUndefined();
    expect(restored).toEqual(form);
    expect(content.username).toBe('ada');
    expect(content.industry).toBe('Computing');
    expect(content.projects).toEqual(profile.projects);
    expect(preview.username).toBe(content.username);
    expect(preview.name).toBe(content.name);
    expect(preview.industry).toBe(content.industry);
    expect(preview.experience).toEqual(form.experience);
    expect(preview.projects).toEqual(form.projects);
    expect(preview.sectionsOrder).toEqual(form.sectionsOrder);
  });

  test('round-trips private, unlisted, and public editor flags', () => {
    const cases = [
      ['private', false, false],
      ['unlisted', true, false],
      ['public', true, true],
    ];

    for (const [mode, isPublic, isDirectoryListed] of cases) {
      const form = toFormValues({
        ...profile,
        isPublic,
        isDirectoryListed,
      });
      const payload = toMutationPayload(form);
      const restored = fromMutationPayload(payload);

      expect(resolveProfileAccessMode(form.isPublic, form.isDirectoryListed)).toBe(
        mode
      );
      expect(
        resolveProfileAccessMode(
          payload.isPublic,
          payload.isDirectoryListed
        )
      ).toBe(mode);
      expect(
        resolveProfileAccessMode(
          restored.isPublic,
          restored.isDirectoryListed
        )
      ).toBe(mode);
    }
  });

  test('trims optional fields and deduplicates skills and technologies', () => {
    const form = toFormValues(profile);
    form.name = '  Ada Lovelace  ';
    form.title = '   ';
    form.skills = [' TypeScript ', 'TypeScript', '', 'Math'];
    form.projects[0] = {
      ...form.projects[0],
      company: '  Babbage  ',
      technologies: [' TypeScript ', 'TypeScript', '', ' Math '],
    };

    const payload = toMutationPayload(form);

    expect(payload.name).toBe('Ada Lovelace');
    expect(payload.title).toBeUndefined();
    expect(payload.skills).toEqual(['TypeScript', 'Math']);
    expect(payload.projects[0].company).toBe('Babbage');
    expect(payload.projects[0].technologies).toEqual(['TypeScript', 'Math']);
  });

  test('canonicalizes exact preview image tokens after a save roundtrip', () => {
    const tokenizedImage = `/api/storage/image-id?token=${'a'.repeat(48)}`;
    const form = toFormValues(profile);
    form.avatar = tokenizedImage;
    form.projects[0].images = [tokenizedImage, 'https://example.com/image.png'];
    form.exhibitions = [
      {
        ...createEmptyExhibitionEntry('exhibition'),
        title: 'Show',
        year: '2026',
        images: [tokenizedImage],
      },
    ];
    form.awards = [
      {
        ...createEmptyAwardEntry('award'),
        title: 'Prize',
        issuer: 'Society',
        year: '2026',
        images: [tokenizedImage],
      },
    ];

    const payload = toMutationPayload(form);
    const restored = fromMutationPayload(payload);

    expect(payload.projects[0].images).toEqual([
      tokenizedImage,
      'https://example.com/image.png',
    ]);
    expect(restored.projects[0].images).toEqual([
      '/api/storage/image-id',
      'https://example.com/image.png',
    ]);
    expect(restored.avatar).toBe('/api/storage/image-id');
    expect(restored.exhibitions[0].images).toEqual(['/api/storage/image-id']);
    expect(restored.awards[0].images).toEqual(['/api/storage/image-id']);
  });

  test('normalizes malformed legacy version section orders before loading', () => {
    const legacyVersion = {
      sectionsOrder: ['projects', 'unknown', 'bio', 'projects'],
    };

    const resolved = resolveSectionsOrder(legacyVersion.sectionsOrder);
    expect(resolved.slice(0, 2)).toEqual(['projects', 'bio']);
    expect(resolved).toContain('languages');
    expect(resolved).toContain('publications');
    expect(resolved).toContain('interests');
  });
});

describe('blank entry predicates', () => {
  test('prunes empty entries and preserves entries with meaningful values', () => {
    expect(isBlankExperience(createEmptyExperienceEntry('experience'))).toBe(
      true
    );
    expect(
      isBlankExperience({
        ...createEmptyExperienceEntry('experience'),
        current: true,
      })
    ).toBe(false);

    expect(isBlankEducation(createEmptyEducationEntry('education'))).toBe(true);
    expect(
      isBlankEducation({
        ...createEmptyEducationEntry('education'),
        degree: 'Math',
      })
    ).toBe(false);

    expect(isBlankProject(createEmptyProjectEntry('project'))).toBe(true);
    expect(
      isBlankProject({
        ...createEmptyProjectEntry('project'),
        images: ['/api/storage/image-id'],
      })
    ).toBe(false);

    expect(
      isBlankCertification(createEmptyCertificationEntry('certification'))
    ).toBe(true);
    expect(
      isBlankCertification({
        ...createEmptyCertificationEntry('certification'),
        year: '2024',
      })
    ).toBe(false);

    expect(isBlankLanguage(createEmptyLanguageEntry('language'))).toBe(true);
    expect(
      isBlankLanguage({
        ...createEmptyLanguageEntry('language'),
        name: 'French',
      })
    ).toBe(false);
    expect(
      isBlankPublication(createEmptyPublicationEntry('publication'))
    ).toBe(true);
    expect(
      isBlankPublication({
        ...createEmptyPublicationEntry('publication'),
        title: 'Notes',
      })
    ).toBe(false);

    expect(
      isBlankVolunteering(createEmptyVolunteeringEntry('volunteering'))
    ).toBe(true);
    expect(
      isBlankVolunteering({
        ...createEmptyVolunteeringEntry('volunteering'),
        startDate: '2024-01',
      })
    ).toBe(false);

    expect(isBlankExhibition(createEmptyExhibitionEntry('exhibition'))).toBe(
      true
    );
    expect(
      isBlankExhibition({
        ...createEmptyExhibitionEntry('exhibition'),
        venue: 'Gallery',
      })
    ).toBe(false);
    expect(
      isBlankExhibition({
        ...createEmptyExhibitionEntry('exhibition'),
        images: ['/api/storage/image-id'],
      })
    ).toBe(false);

    expect(isBlankAward(createEmptyAwardEntry('award'))).toBe(true);
    expect(
      isBlankAward({ ...createEmptyAwardEntry('award'), issuer: 'Society' })
    ).toBe(false);
    expect(
      isBlankAward({
        ...createEmptyAwardEntry('award'),
        images: ['/api/storage/image-id'],
      })
    ).toBe(false);
  });
});
