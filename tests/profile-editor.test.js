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
import { createProfileUpdateFormSchema } from '../lib/profile/editor-schema';
import {
  buildSavePayload,
  collectSavedImageTokens,
  prepareDraft,
  remapEntryErrors,
  stripBlankEntries,
} from '../components/workspace/draft';

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

      expect(
        resolveProfileAccessMode(form.isPublic, form.isDirectoryListed)
      ).toBe(mode);
      expect(
        resolveProfileAccessMode(payload.isPublic, payload.isDirectoryListed)
      ).toBe(mode);
      expect(
        resolveProfileAccessMode(restored.isPublic, restored.isDirectoryListed)
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
    expect(isBlankPublication(createEmptyPublicationEntry('publication'))).toBe(
      true
    );
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

describe('workspace autosave drafts', () => {
  const schema = createProfileUpdateFormSchema(profile);

  test('access flags come from the live profile, never from form state', () => {
    const draft = prepareDraft(
      { ...toFormValues(profile), isPublic: true, isDirectoryListed: true },
      schema,
      profile
    );
    expect(draft.ok).toBe(true);
    expect('isPublic' in draft.payload).toBe(false);

    const saved = buildSavePayload(draft.payload, {
      isPublic: false,
      isDirectoryListed: false,
      accessMode: 'passcode',
    });
    expect(saved.isPublic).toBe(false);
    expect(saved.isDirectoryListed).toBe(false);

    const accepted = buildSavePayload(
      draft.payload,
      { isPublic: false, accessMode: 'private' },
      'unlisted'
    );
    expect(accepted.isPublic).toBe(true);
    expect(accepted.isDirectoryListed).toBe(false);
  });

  test('ignores untouched blank entries', () => {
    const values = toFormValues(profile);
    const base = prepareDraft(values, schema, profile);
    const withBlank = prepareDraft(
      {
        ...values,
        experience: [...values.experience, createEmptyExperienceEntry('new')],
      },
      schema,
      profile
    );
    expect(withBlank.ok).toBe(true);
    expect(withBlank.invalidCount).toBe(0);
    expect(withBlank.key).toBe(base.key);
  });

  test('saves valid edits while an unsaved entry is still invalid', () => {
    const values = toFormValues(profile);
    const draft = prepareDraft(
      {
        ...values,
        title: 'Analyst',
        experience: [
          ...values.experience,
          { ...createEmptyExperienceEntry('new'), role: 'Analyst' },
        ],
      },
      schema,
      profile
    );
    expect(draft.ok).toBe(true);
    // Company, start date, and end date are still missing.
    expect(draft.invalidCount).toBe(3);
    expect(draft.payload.title).toBe('Analyst');
    expect(draft.payload.experience.map((entry) => entry.id)).toEqual([
      'experience-1',
    ]);
  });

  test('sends the last-saved version of an invalid saved entry, images included', () => {
    const images = ['/api/storage/one', '/api/storage/two'];
    const live = {
      ...profile,
      projects: [{ id: 'project-1', title: 'Notes', year: '1843', images }],
    };
    const values = toFormValues(live);
    const token = `/api/storage/three?token=${'a'.repeat(48)}`;
    const draft = prepareDraft(
      {
        ...values,
        name: 'Ada King',
        projects: [
          { ...values.projects[0], title: '', images: [images[0]] },
          { ...values.projects[0], id: 'project-2', year: '', images: [token] },
        ],
      },
      createProfileUpdateFormSchema(live),
      live
    );
    expect(draft.ok).toBe(true);
    expect(draft.invalidCount).toBe(2);
    expect(draft.payload.name).toBe('Ada King');
    expect(draft.payload.projects).toHaveLength(1);
    expect(draft.payload.projects[0].title).toBe('Notes');
    expect(draft.payload.projects[0].images).toEqual(images);
  });

  test('sends saved values for invalid top-level fields', () => {
    const live = { ...profile, avatar: '/api/storage/avatar' };
    const draft = prepareDraft(
      {
        ...toFormValues(live),
        name: ' ',
        avatar: 'https://example.com/a.png',
        title: 'Countess',
      },
      createProfileUpdateFormSchema(live),
      live
    );
    expect(draft.ok).toBe(true);
    expect(draft.invalidCount).toBe(2);
    expect(draft.payload.name).toBe('Ada Lovelace');
    expect(draft.payload.avatar).toBe('/api/storage/avatar');
    expect(draft.payload.title).toBe('Countess');
  });

  test('never sends values the updateProfile mutation would reject', () => {
    const values = toFormValues(profile);
    const project = values.projects[0];
    const invalid = [
      { website: `https://example.com/${'a'.repeat(500)}` },
      { email: `${'a'.repeat(250)}@example.com` },
      {
        projects: [
          {
            ...project,
            technologies: Array.from({ length: 31 }, (_, i) => `t${i}`),
          },
        ],
      },
      {
        publications: [
          { id: 'p', title: 'Paper', url: 'https://user:pass@example.com' },
        ],
      },
    ];
    const base = prepareDraft(values, schema, profile);
    for (const change of invalid) {
      const draft = prepareDraft({ ...values, ...change }, schema, profile);
      expect(draft.invalidCount).toBeGreaterThan(0);
      expect(draft.key).toBe(base.key);
    }
  });

  test('maps errors for kept entries back to their form index', () => {
    const { kept } = stripBlankEntries({
      ...toFormValues(profile),
      experience: [
        createEmptyExperienceEntry('blank'),
        { ...createEmptyExperienceEntry('started'), role: 'Analyst' },
      ],
    });
    expect(kept.experience).toEqual([1]);
    const errors = remapEntryErrors(
      { experience: [{ company: { type: 'too_small', message: 'Required' } }] },
      kept
    );
    expect(errors.experience[0]).toBeUndefined();
    expect(errors.experience[1].company.message).toBe('Required');
  });

  test('collects one-time preview tokens that a save consumed', () => {
    const url = `/api/storage/avatar?token=${'a'.repeat(48)}`;
    const draft = prepareDraft(
      { ...toFormValues(profile), avatar: url },
      schema,
      profile
    );
    expect(draft.ok).toBe(true);
    expect(collectSavedImageTokens(draft.payload)).toEqual(
      new Map([[url, '/api/storage/avatar']])
    );
  });
});
