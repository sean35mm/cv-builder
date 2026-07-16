import { query, mutation, type QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { resolveProfileTypography } from '../lib/profile/typography';
import type { Doc, Id } from './_generated/dataModel';
import {
  profileDocValidator,
  publicProfileValidator,
  toPublicProfile,
} from './profileValidators';
import {
  colorThemeValidator,
  profileFontValidator,
  updateProfileArgsValidatorFields,
} from './profileValueValidators';
import {
  boundedArray,
  normalizeEmail,
  normalizeSectionsOrder,
  normalizeUsername,
  optionalText,
  requiredText,
} from './validation';
import { resolveEffectivePublicProfileState } from './publicProfiles';
import { syncDirectoryProjection } from './directory';
import { ensureAccountActive } from './deletion';
import {
  LEGACY_USERNAME_PREFLIGHT_LIMIT,
  isLegacyUsernameTaken,
} from './usernameCollisions';

type Experience = Doc<'profiles'>['experience'][number];
type Education = Doc<'profiles'>['education'][number];
type Project = NonNullable<Doc<'profiles'>['projects']>[number];
type Certification = NonNullable<Doc<'profiles'>['certifications']>[number];
type Volunteering = NonNullable<Doc<'profiles'>['volunteering']>[number];
type Exhibition = NonNullable<Doc<'profiles'>['exhibitions']>[number];
type Award = NonNullable<Doc<'profiles'>['awards']>[number];

const entryId = (value: string, field: string) =>
  requiredText(value, `${field} identifier`, 100);
const month = (value: string, field: string) => {
  if (!value.trim() || value.length > 50) {
    throw new Error(`${field} must be between 1 and 50 characters`);
  }
  return value;
};
const year = (value: string, field: string) => {
  if (!value.trim() || value.length > 20) {
    throw new Error(`${field} must be between 1 and 20 characters`);
  }
  return value;
};
const optionalYear = (value: string | undefined, field: string) => {
  if (value === undefined || value.trim() === '') return undefined;
  if (value.length > 20)
    throw new Error(`${field} must be 20 characters or fewer`);
  return value;
};

function normalizeExperience(entries: Experience[]): Experience[] {
  boundedArray(entries, 'Experience', 50);
  return entries.map((entry) => ({
    id: entryId(entry.id, 'Experience'),
    role: requiredText(entry.role, 'Experience role', 120),
    company: requiredText(entry.company, 'Experience company', 120),
    startDate: month(entry.startDate, 'Experience start date'),
    endDate:
      entry.current && entry.endDate === undefined
        ? undefined
        : month(entry.endDate ?? '', 'Experience end date'),
    current: entry.current,
    description: optionalText(
      entry.description,
      'Experience description',
      1000
    ),
  }));
}

function normalizeEducation(entries: Education[]): Education[] {
  boundedArray(entries, 'Education', 50);
  return entries.map((entry) => ({
    id: entryId(entry.id, 'Education'),
    degree: requiredText(entry.degree, 'Education degree', 120),
    school: requiredText(entry.school, 'Education school', 120),
    startDate: month(entry.startDate, 'Education start date'),
    endDate:
      entry.current && entry.endDate === undefined
        ? undefined
        : month(entry.endDate ?? '', 'Education end date'),
    current: entry.current,
    description: optionalText(entry.description, 'Education description', 1000),
  }));
}

function normalizeProjects(entries: Project[]): Project[] {
  boundedArray(entries, 'Projects', 50);
  return entries.map((entry) => {
    const images = boundedArray(entry.images ?? [], 'Project images', 3).map(
      (image) => requiredText(image, 'Project image', 500)
    );
    const technologies = boundedArray(
      entry.technologies ?? [],
      'Project technologies',
      30
    ).map((technology) => requiredText(technology, 'Project technology', 50));
    return {
      id: entryId(entry.id, 'Project'),
      title: requiredText(entry.title, 'Project title', 160),
      year: year(entry.year, 'Project year'),
      company: optionalText(entry.company, 'Project company', 160),
      link: optionalText(entry.link, 'Project link', 500),
      description: optionalText(entry.description, 'Project description', 1000),
      images: images.length ? images : undefined,
      technologies: technologies.length ? technologies : undefined,
      category: optionalText(entry.category, 'Project category', 80),
      isFeatured: entry.isFeatured,
    };
  });
}

function normalizeCertifications(entries: Certification[]): Certification[] {
  boundedArray(entries, 'Certifications', 50);
  return entries.map((entry) => ({
    id: entryId(entry.id, 'Certification'),
    name: requiredText(entry.name, 'Certification name', 160),
    issuer: requiredText(entry.issuer, 'Certification issuer', 160),
    year: optionalYear(entry.year, 'Certification year'),
    credentialId: optionalText(entry.credentialId, 'Credential ID', 160),
    link: optionalText(entry.link, 'Certification link', 500),
    description: optionalText(
      entry.description,
      'Certification description',
      1000
    ),
  }));
}

function normalizeVolunteering(entries: Volunteering[]): Volunteering[] {
  boundedArray(entries, 'Volunteering', 50);
  return entries.map((entry) => ({
    id: entryId(entry.id, 'Volunteering'),
    role: requiredText(entry.role, 'Volunteering role', 160),
    organization: requiredText(entry.organization, 'Organization', 160),
    startDate: month(entry.startDate, 'Volunteering start date'),
    endDate:
      entry.current && entry.endDate === undefined
        ? undefined
        : month(entry.endDate ?? '', 'Volunteering end date'),
    current: entry.current,
    description: optionalText(
      entry.description,
      'Volunteering description',
      1000
    ),
  }));
}

function normalizeExhibitions(entries: Exhibition[]): Exhibition[] {
  boundedArray(entries, 'Exhibitions', 50);
  return entries.map((entry) => ({
    id: entryId(entry.id, 'Exhibition'),
    title: requiredText(entry.title, 'Exhibition title', 160),
    venue: optionalText(entry.venue, 'Exhibition venue', 160),
    year: year(entry.year, 'Exhibition year'),
    location: optionalText(entry.location, 'Exhibition location', 160),
    link: optionalText(entry.link, 'Exhibition link', 500),
    description: optionalText(
      entry.description,
      'Exhibition description',
      1000
    ),
  }));
}

function normalizeAwards(entries: Award[]): Award[] {
  boundedArray(entries, 'Awards', 50);
  return entries.map((entry) => ({
    id: entryId(entry.id, 'Award'),
    title: requiredText(entry.title, 'Award title', 160),
    issuer: requiredText(entry.issuer, 'Award issuer', 160),
    year: year(entry.year, 'Award year'),
    link: optionalText(entry.link, 'Award link', 500),
    description: optionalText(entry.description, 'Award description', 1000),
  }));
}

const imageStorageId = (rawId: string): Id<'_storage'> => {
  if (!rawId || rawId.length > 200 || !/^[A-Za-z0-9_-]+$/.test(rawId)) {
    throw new Error('Project image reference is invalid');
  }
  return rawId as Id<'_storage'>;
};

const STORAGE_IMAGE_PATTERN =
  /^\/api\/storage\/([A-Za-z0-9_-]+)(?:\?token=([A-Za-z0-9_-]{48}))?$/;

const storageImageReference = (image: string) => {
  const match = image.match(STORAGE_IMAGE_PATTERN);
  if (!match) return null;
  const storageId = imageStorageId(match[1]);
  return {
    storageId,
    canonicalUrl: `/api/storage/${storageId}`,
    previewToken: match[2],
  };
};

const usernameIsTaken = async (
  ctx: Pick<QueryCtx, 'db'>,
  normalizedUsername: string
): Promise<boolean> => {
  const normalizedMatches = await ctx.db
    .query('profiles')
    .withIndex('by_normalized_username', (q) =>
      q.eq('normalizedUsername', normalizedUsername)
    )
    .take(2);
  if (normalizedMatches.length > 0) return true;

  const exactMatch = await ctx.db
    .query('profiles')
    .withIndex('by_username', (q) => q.eq('username', normalizedUsername))
    .first();
  if (exactMatch) return true;

  const legacyProfiles = await ctx.db
    .query('profiles')
    .take(LEGACY_USERNAME_PREFLIGHT_LIMIT + 1);
  return isLegacyUsernameTaken(legacyProfiles, normalizedUsername);
};

export const getMyProfile = query({
  args: {},
  returns: v.union(v.null(), profileDocValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    return profile && {
      ...profile,
      ...resolveProfileTypography(profile),
    };
  },
});

export const getProfileByUsername = query({
  args: { username: v.string() },
  returns: v.union(v.null(), publicProfileValidator),
  handler: async (ctx, args) => {
    const username = args.username.trim();
    if (!username || username.length > 100 || /[/?#%\\]/.test(username)) {
      throw new Error('Username is invalid');
    }
    const exactProfile = await ctx.db
      .query('profiles')
      .withIndex('by_username', (q) => q.eq('username', username))
      .unique();
    const normalizedCandidate = username.toLowerCase();
    const normalizedProfile = /^[a-z0-9_-]{3,30}$/.test(normalizedCandidate)
      ? await ctx.db
          .query('profiles')
          .withIndex('by_normalized_username', (q) =>
            q.eq('normalizedUsername', normalizedCandidate)
          )
          .unique()
      : null;
    const profile =
      exactProfile ??
      normalizedProfile ??
      (normalizedCandidate !== username &&
      /^[a-z0-9_-]{3,30}$/.test(normalizedCandidate)
        ? await ctx.db
            .query('profiles')
            .withIndex('by_username', (q) =>
              q.eq('username', normalizedCandidate)
            )
            .unique()
        : null);

    if (!profile || !profile.isPublic) {
      return null;
    }

    const state = await resolveEffectivePublicProfileState(ctx, profile);
    if (!state) return null;

    return toPublicProfile(profile, state);
  },
});

export const createProfile = mutation({
  args: {
    username: v.string(),
    name: v.string(),
    title: v.optional(v.string()),
    industry: v.optional(v.string()),
    location: v.optional(v.string()),
    bio: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    github: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    twitter: v.optional(v.string()),
  },
  returns: v.id('profiles'),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }
    await ensureAccountActive(ctx, userId);

    const username = normalizeUsername(args.username);
    const name = requiredText(args.name, 'Name', 120);
    const email = args.email ? normalizeEmail(args.email) : undefined;

    if (await usernameIsTaken(ctx, username)) {
      throw new Error('Username already taken');
    }

    // Check if user already has a profile
    const userProfile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (userProfile) {
      throw new Error('User already has a profile');
    }

    const profileId = await ctx.db.insert('profiles', {
      userId,
      username,
      normalizedUsername: username,
      name,
      title: optionalText(args.title, 'Title', 120),
      industry: optionalText(args.industry, 'Industry', 120),
      location: optionalText(args.location, 'Location', 120),
      bio: optionalText(args.bio, 'Bio', 300),
      email,
      website: optionalText(args.website, 'Website', 500),
      github: optionalText(args.github, 'GitHub', 120),
      linkedin: optionalText(args.linkedin, 'LinkedIn', 120),
      twitter: optionalText(args.twitter, 'Twitter', 120),
      colorTheme: 'sage',
      headingFont: 'default',
      bodyFont: 'default',
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      volunteering: [],
      exhibitions: [],
      awards: [],
      sectionsOrder: [
        'header',
        'bio',
        'contact',
        'experience',
        'education',
        'skills',
        'projects',
        'certifications',
        'volunteering',
        'exhibitions',
        'awards',
        'testimonials',
      ],
      isPublic: false,
      isDirectoryListed: false,
    });

    return profileId;
  },
});

export const updateColorTheme = mutation({
  args: {
    colorTheme: colorThemeValidator,
  },
  returns: v.id('profiles'),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }
    await ensureAccountActive(ctx, userId);

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (!profile) {
      throw new Error('Profile not found');
    }

    await ctx.db.patch(profile._id, { colorTheme: args.colorTheme });
    return profile._id;
  },
});

export const updateTemplate = mutation({
  args: {
    templateId: v.union(
      v.literal('classic'),
      v.literal('modern'),
      v.literal('minimal'),
      v.literal('developer'),
      v.literal('creative')
    ),
  },
  returns: v.id('profiles'),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }
    await ensureAccountActive(ctx, userId);

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (!profile) {
      throw new Error('Profile not found');
    }

    await ctx.db.patch(profile._id, { templateId: args.templateId });
    return profile._id;
  },
});

export const updateTypography = mutation({
  args: {
    headingFont: profileFontValidator,
    bodyFont: profileFontValidator,
  },
  returns: v.id('profiles'),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }
    await ensureAccountActive(ctx, userId);

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (!profile) {
      throw new Error('Profile not found');
    }

    await ctx.db.patch(profile._id, {
      headingFont: args.headingFont,
      bodyFont: args.bodyFont,
    });
    return profile._id;
  },
});

export const updateProfile = mutation({
  args: updateProfileArgsValidatorFields,
  returns: v.id('profiles'),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }
    await ensureAccountActive(ctx, userId);

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (!profile) {
      throw new Error('Profile not found');
    }

    const experience = normalizeExperience(args.experience);
    const education = normalizeEducation(args.education);
    const normalizedProjects = normalizeProjects(args.projects);
    const certifications = normalizeCertifications(args.certifications);
    const volunteering = normalizeVolunteering(args.volunteering);
    const exhibitions = normalizeExhibitions(args.exhibitions);
    const awards = normalizeAwards(args.awards);
    boundedArray(args.skills, 'Skills', 50);
    const skills = args.skills.map((skill) => requiredText(skill, 'Skill', 50));
    const sectionsOrder = normalizeSectionsOrder(args.sectionsOrder);
    const previousImageReferences = new Set(
      (profile.projects ?? []).flatMap((project) => project.images ?? [])
    );
    const trackedUploads = new Map<string, Doc<'uploadedFiles'>>();
    const projects: Project[] = [];
    for (const project of normalizedProjects) {
      const images: string[] = [];
      for (const image of project.images ?? []) {
        const reference = storageImageReference(image);
        if (!reference) {
          if (
            image.startsWith('/api/storage/') ||
            !previousImageReferences.has(image)
          ) {
            throw new Error('New project images must use an owned upload');
          }
          images.push(image);
          continue;
        }

        const upload = await ctx.db
          .query('uploadedFiles')
          .withIndex('by_storage', (q) =>
            q.eq('storageId', reference.storageId)
          )
          .unique();
        if (!upload) {
          if (
            reference.previewToken ||
            !previousImageReferences.has(reference.canonicalUrl)
          ) {
            throw new Error('Project image upload was not found');
          }
          images.push(reference.canonicalUrl);
          continue;
        }
        if (upload.userId !== userId) {
          throw new Error('Project image is not owned by this user');
        }
        if (
          reference.previewToken &&
          upload.previewToken !== reference.previewToken
        ) {
          throw new Error('Project image preview token is invalid');
        }
        if (!(await ctx.db.system.get(reference.storageId))) {
          throw new Error('Project image upload was not found');
        }

        trackedUploads.set(reference.storageId, upload);
        images.push(reference.canonicalUrl);
      }
      projects.push({
        ...project,
        images: images.length ? images : undefined,
      });
    }
    const previousImageIds = new Set(
      (profile.projects ?? []).flatMap((project) =>
        (project.images ?? [])
          .map((image) => storageImageReference(image)?.storageId)
          .filter((id): id is Id<'_storage'> => Boolean(id))
      )
    );
    const nextImageIds = new Set(
      projects.flatMap((project) =>
        (project.images ?? [])
          .map((image) => storageImageReference(image)?.storageId)
          .filter((id): id is Id<'_storage'> => Boolean(id))
      )
    );

    await ctx.db.patch(profile._id, {
      name: requiredText(args.name, 'Name', 120),
      title: optionalText(args.title, 'Title', 120),
      industry: optionalText(args.industry, 'Industry', 120),
      location: optionalText(args.location, 'Location', 120),
      bio: optionalText(args.bio, 'Bio', 300),
      email: args.email ? normalizeEmail(args.email) : undefined,
      website: optionalText(args.website, 'Website', 500),
      github: optionalText(args.github, 'GitHub', 120),
      linkedin: optionalText(args.linkedin, 'LinkedIn', 120),
      twitter: optionalText(args.twitter, 'Twitter', 120),
      experience,
      education,
      skills,
      projects,
      certifications,
      volunteering,
      exhibitions,
      awards,
      ...(sectionsOrder ? { sectionsOrder } : {}),
      isPublic: args.isPublic,
      isDirectoryListed: args.isPublic && args.isDirectoryListed === true,
    });

    const updatedProfile = await ctx.db.get(profile._id);
    if (updatedProfile) await syncDirectoryProjection(ctx, updatedProfile);

    for (const upload of trackedUploads.values()) {
      if (upload.profileId !== profile._id) {
        await ctx.db.patch(upload._id, { profileId: profile._id });
      }
    }

    for (const storageId of previousImageIds) {
      if (nextImageIds.has(storageId)) continue;
      const upload = await ctx.db
        .query('uploadedFiles')
        .withIndex('by_storage', (q) => q.eq('storageId', storageId))
        .unique();
      if (upload?.userId === userId) {
        await ctx.storage.delete(storageId);
        await ctx.db.delete(upload._id);
      }
      // Untracked legacy objects have no verifiable owner and are intentionally
      // left orphaned rather than risking deletion of another user's file.
    }

    return profile._id;
  },
});

export const checkUsernameAvailable = query({
  args: { username: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const username = normalizeUsername(args.username);
    return !(await usernameIsTaken(ctx, username));
  },
});
