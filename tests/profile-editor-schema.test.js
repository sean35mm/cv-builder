import { describe, expect, test } from 'bun:test';
import { toFormValues } from '../lib/profile/editor';
import { createProfileUpdateFormSchema } from '../lib/profile/editor-schema';

const profile = {
  username: 'grace',
  name: 'Grace Hopper',
  experience: [
    {
      id: 'experience-1',
      role: 'Rear Admiral',
      company: 'US Navy',
      startDate: '1943-01',
      endDate: '1986-08',
      current: false,
    },
  ],
  education: [],
  skills: ['Compilers'],
  projects: [
    {
      id: 'project-1',
      title: 'Compiler',
      year: '1952',
      link: 'example.com/compiler',
    },
  ],
  certifications: [],
  volunteering: [],
  exhibitions: [],
  awards: [],
  sectionsOrder: ['header', 'experience'],
  isPublic: true,
};

describe('profile editor schema', () => {
  test('enforces required fields and duplicate skill rules', () => {
    const schema = createProfileUpdateFormSchema(profile);
    const values = toFormValues(profile);

    expect(schema.safeParse({ ...values, name: ' ' }).success).toBe(false);
    expect(
      schema.safeParse({
        ...values,
        experience: [{ ...values.experience[0], role: '' }],
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({ ...values, skills: ['TypeScript', 'typescript'] })
        .success
    ).toBe(false);
  });

  test('enforces date order and current-entry end-date behavior', () => {
    const schema = createProfileUpdateFormSchema(profile);
    const values = toFormValues(profile);

    expect(
      schema.safeParse({
        ...values,
        experience: [{ ...values.experience[0], endDate: '1942-12' }],
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        ...values,
        experience: [
          {
            ...values.experience[0],
            current: true,
            endDate: '1986-08',
          },
        ],
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        ...values,
        experience: [{ ...values.experience[0], current: true, endDate: '' }],
      }).success
    ).toBe(true);
  });

  test('rejects unknown and duplicate section IDs', () => {
    const schema = createProfileUpdateFormSchema(profile);
    const values = toFormValues(profile);

    expect(
      schema.safeParse({ ...values, sectionsOrder: ['header', 'unknown'] })
        .success
    ).toBe(false);
    expect(
      schema.safeParse({ ...values, sectionsOrder: ['header', 'header'] })
        .success
    ).toBe(false);
  });

  test('preserves URL behavior and field limits', () => {
    const schema = createProfileUpdateFormSchema(profile);
    const values = toFormValues(profile);

    expect(schema.safeParse(values).success).toBe(true);
    expect(
      schema.safeParse({
        ...values,
        projects: [{ ...values.projects[0], link: 'javascript:alert(1)' }],
      }).success
    ).toBe(false);
    expect(schema.safeParse({ ...values, bio: 'x'.repeat(301) }).success).toBe(
      false
    );
    expect(
      schema.safeParse({
        ...values,
        projects: [
          {
            ...values.projects[0],
            images: ['one', 'two', 'three', 'four'],
          },
        ],
      }).success
    ).toBe(false);
  });

  test('accepts unchanged legacy dates and years by ID but rejects edits to invalid values', () => {
    const legacyProfile = {
      ...profile,
      experience: [
        {
          id: 'legacy-date',
          role: 'Programmer',
          company: 'Navy',
          startDate: 'Spring 1944',
          endDate: 'Present',
          current: true,
        },
      ],
      projects: [
        {
          id: 'legacy-year',
          title: 'Compiler',
          year: 'circa 1952',
        },
      ],
    };
    const schema = createProfileUpdateFormSchema(legacyProfile);
    const values = toFormValues(legacyProfile);

    expect(schema.safeParse(values).success).toBe(true);
    expect(
      schema.safeParse({
        ...values,
        experience: [{ ...values.experience[0], startDate: 'Summer 1944' }],
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        ...values,
        projects: [{ ...values.projects[0], year: 'about 1952' }],
      }).success
    ).toBe(false);
  });
});
