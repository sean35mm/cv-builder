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
import {
  getProfileAccessFlags,
  isProfilePubliclyAccessible,
  resolveProfileAccessMode,
} from '../lib/profile/access';
import {
  enumerateProfileManagedMedia,
  parseManagedMediaUrl,
  removedManagedMediaStorageIds,
  type ManagedMediaSection,
} from '../lib/profile/media';

type Experience = Doc<'profiles'>['experience'][number];
type Education = Doc<'profiles'>['education'][number];
type Language = NonNullable<Doc<'profiles'>['languages']>[number];
type Project = NonNullable<Doc<'profiles'>['projects']>[number];
type Publication = NonNullable<Doc<'profiles'>['publications']>[number];
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
const optionalUrl = (value: string | undefined, field: string) => {
  const normalized = optionalText(value, field, 500);
  if (!normalized) return undefined;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(normalized)
    ? normalized
    : `https://${normalized}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`${field} must be a valid HTTP URL`);
  }
  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username ||
    url.password
  ) {
    throw new Error(`${field} must be a valid HTTP URL`);
  }
  return normalized;
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

function normalizeLanguages(entries: Language[]): Language[] {
  boundedArray(entries, 'Languages', 50);
  const seen = new Set<string>();
  const result: Language[] = [];
  for (const entry of entries) {
    const name = requiredText(entry.name, 'Language name', 100);
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      id: entryId(entry.id, 'Language'),
      name,
      proficiency: entry.proficiency,
    });
  }
  return result;
}

function normalizePublications(entries: Publication[]): Publication[] {
  boundedArray(entries, 'Publications', 50);
  const seen = new Set<string>();
  const result: Publication[] = [];
  for (const entry of entries) {
    const title = requiredText(entry.title, 'Publication title', 200);
    const publisher = optionalText(
      entry.publisher,
      'Publication publisher',
      160
    );
    const date = optionalText(entry.date, 'Publication date', 100);
    const url = optionalUrl(entry.url, 'Publication URL');
    const authors = boundedArray(entry.authors ?? [], 'Publication authors', 20)
      .map((author) => requiredText(author, 'Publication author', 120))
      .filter(
        (author, index, values) =>
          values.findIndex(
            (candidate) =>
              candidate.toLocaleLowerCase() === author.toLocaleLowerCase()
          ) === index
      );
    const key = [title, publisher, date, url]
      .filter(Boolean)
      .join('|')
      .toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      id: entryId(entry.id, 'Publication'),
      title,
      publisher,
      date,
      url,
      authors: authors.length ? authors : undefined,
      description: optionalText(
        entry.description,
        'Publication description',
        1000
      ),
    });
  }
  return result;
}

function normalizeInterests(entries: string[]): string[] {
  boundedArray(entries, 'Interests', 50);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of entries) {
    const interest = requiredText(entry, 'Interest', 100);
    const key = interest.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(interest);
  }
  return result;
}

export function resolveOptionalProfileCollections(
  args: {
    languages?: Language[];
    publications?: Publication[];
    interests?: string[];
  },
  profile: Pick<Doc<'profiles'>, 'languages' | 'publications' | 'interests'>
) {
  return {
    languages:
      args.languages === undefined
        ? (profile.languages ?? [])
        : normalizeLanguages(args.languages),
    publications:
      args.publications === undefined
        ? (profile.publications ?? [])
        : normalizePublications(args.publications),
    interests:
      args.interests === undefined
        ? (profile.interests ?? [])
        : normalizeInterests(args.interests),
  };
}

const mergeLegacyEntryFields = <T extends { id: string }>(
  incoming: T[],
  stored: T[] | undefined,
  fields: (keyof T)[]
): T[] => {
  // d1ccde0 already sent stable IDs. Preserve only fields that did not exist
  // in that client; unmatched/replaced IDs intentionally receive no merge.
  const storedById = new Map((stored ?? []).map((entry) => [entry.id, entry]));
  return incoming.map((entry) => {
    const previous = storedById.get(entry.id);
    if (!previous) return entry;
    const merged = { ...entry };
    for (const field of fields) {
      if (entry[field] === undefined && previous[field] !== undefined) {
        merged[field] = previous[field];
      }
    }
    return merged;
  });
};

export function resolveUpdateProfileCompatibility(
  args: {
    avatar?: string;
    industry?: string;
    languages?: Language[];
    publications?: Publication[];
    interests?: string[];
    projects: Project[];
    exhibitions: Exhibition[];
    awards: Award[];
    isPublic: boolean;
    isDirectoryListed?: boolean;
  },
  profile: Pick<
    Doc<'profiles'>,
    | 'avatar'
    | 'industry'
    | 'languages'
    | 'publications'
    | 'interests'
    | 'projects'
    | 'exhibitions'
    | 'awards'
    | 'isPublic'
    | 'isDirectoryListed'
    | 'accessMode'
  >
) {
  const isLegacyPayload =
    args.languages === undefined &&
    args.publications === undefined &&
    args.interests === undefined &&
    args.isDirectoryListed === undefined;
  const existingAccessMode = resolveProfileAccessMode(
    profile.isPublic,
    profile.isDirectoryListed,
    profile.accessMode
  );
  const accessMode =
    existingAccessMode === 'passcode'
      ? 'passcode'
      : isLegacyPayload
        ? args.isPublic
          ? existingAccessMode === 'public'
            ? 'public'
            : 'unlisted'
          : 'private'
        : resolveProfileAccessMode(args.isPublic, args.isDirectoryListed);

  return {
    isLegacyPayload,
    avatar: isLegacyPayload ? profile.avatar : args.avatar,
    industry: isLegacyPayload ? profile.industry : args.industry,
    projects: isLegacyPayload
      ? mergeLegacyEntryFields(args.projects, profile.projects, [
          'images',
          'technologies',
          'category',
          'isFeatured',
        ])
      : args.projects,
    exhibitions: isLegacyPayload
      ? mergeLegacyEntryFields(args.exhibitions, profile.exhibitions, [
          'images',
        ])
      : args.exhibitions,
    awards: isLegacyPayload
      ? mergeLegacyEntryFields(args.awards, profile.awards, ['images'])
      : args.awards,
    accessMode,
  };
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
  return entries.map((entry) => {
    const images = boundedArray(entry.images ?? [], 'Exhibition images', 3).map(
      (image) => requiredText(image, 'Exhibition image', 500)
    );
    return {
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
      images: images.length ? images : undefined,
    };
  });
}

function normalizeAwards(entries: Award[]): Award[] {
  boundedArray(entries, 'Awards', 50);
  return entries.map((entry) => {
    const images = boundedArray(entry.images ?? [], 'Award images', 3).map(
      (image) => requiredText(image, 'Award image', 500)
    );
    return {
      id: entryId(entry.id, 'Award'),
      title: requiredText(entry.title, 'Award title', 160),
      issuer: requiredText(entry.issuer, 'Award issuer', 160),
      year: year(entry.year, 'Award year'),
      link: optionalText(entry.link, 'Award link', 500),
      description: optionalText(entry.description, 'Award description', 1000),
      images: images.length ? images : undefined,
    };
  });
}

const mediaStorageId = (rawId: string): Id<'_storage'> => {
  if (!rawId || rawId.length > 200 || !/^[A-Za-z0-9_-]+$/.test(rawId)) {
    throw new Error('Image reference is invalid');
  }
  return rawId as Id<'_storage'>;
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

    return (
      profile && {
        ...profile,
        ...resolveProfileTypography(profile),
      }
    );
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

    const accessMode = profile
      ? resolveProfileAccessMode(
          profile.isPublic,
          profile.isDirectoryListed,
          profile.accessMode
        )
      : 'private';
    if (!profile || !isProfilePubliclyAccessible(accessMode)) {
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
      languages: [],
      projects: [],
      publications: [],
      certifications: [],
      volunteering: [],
      exhibitions: [],
      awards: [],
      interests: [],
      sectionsOrder: [
        'header',
        'bio',
        'contact',
        'experience',
        'education',
        'skills',
        'languages',
        'projects',
        'publications',
        'certifications',
        'volunteering',
        'exhibitions',
        'awards',
        'interests',
        'testimonials',
      ],
      isPublic: false,
      isDirectoryListed: false,
      accessMode: 'private',
      accessVersion: 0,
      allowEmbed: false,
      analyticsEnabled: true,
      analyticsDigestOptIn: false,
      defaultLocale: 'en',
      locales: ['en'],
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
    const { languages, publications, interests } =
      resolveOptionalProfileCollections(args, profile);
    const compatibility = resolveUpdateProfileCompatibility(args, profile);
    const normalizedProjects = normalizeProjects(compatibility.projects);
    const certifications = normalizeCertifications(args.certifications);
    const volunteering = normalizeVolunteering(args.volunteering);
    const normalizedExhibitions = normalizeExhibitions(
      compatibility.exhibitions
    );
    const normalizedAwards = normalizeAwards(compatibility.awards);
    boundedArray(args.skills, 'Skills', 50);
    const skills = args.skills.map((skill) => requiredText(skill, 'Skill', 50));
    const sectionsOrder = normalizeSectionsOrder(args.sectionsOrder);
    const previousProjectReferences = new Set(
      (profile.projects ?? []).flatMap((project) => project.images ?? [])
    );
    const previousManagedReferences = new Set(
      enumerateProfileManagedMedia(profile).map(
        (reference) => reference.canonicalUrl
      )
    );
    const trackedUploads = new Map<string, Doc<'uploadedFiles'>>();
    const reconcileManagedReference = async (
      image: string,
      section: ManagedMediaSection,
      allowLegacyProjectReference = false
    ): Promise<string> => {
      const reference = parseManagedMediaUrl(image);
      if (!reference) {
        if (
          allowLegacyProjectReference &&
          !image.startsWith('/api/storage/') &&
          previousProjectReferences.has(image)
        ) {
          return image;
        }
        throw new Error(
          `${section === 'header' ? 'Avatar' : 'New images'} must use an owned upload`
        );
      }

      const storageId = mediaStorageId(reference.storageId);
      const upload = await ctx.db
        .query('uploadedFiles')
        .withIndex('by_storage', (q) => q.eq('storageId', storageId))
        .unique();
      if (!upload) {
        if (
          reference.previewToken ||
          !previousManagedReferences.has(reference.canonicalUrl)
        ) {
          throw new Error('Image upload was not found');
        }
        return reference.canonicalUrl;
      }
      if (upload.userId !== userId) {
        throw new Error('Image is not owned by this user');
      }
      if (upload.profileId && upload.profileId !== profile._id) {
        throw new Error('Image belongs to another profile');
      }
      if (upload.profileId === undefined) {
        if (
          !reference.previewToken ||
          upload.previewToken !== reference.previewToken
        ) {
          throw new Error('Image preview token is invalid');
        }
      } else if (
        reference.previewToken &&
        upload.previewToken !== reference.previewToken
      ) {
        throw new Error('Image preview token is invalid');
      }
      if (!(await ctx.db.system.get(storageId))) {
        throw new Error('Image upload was not found');
      }

      trackedUploads.set(storageId, upload);
      return reference.canonicalUrl;
    };

    const avatar = compatibility.isLegacyPayload
      ? profile.avatar
      : optionalText(compatibility.avatar, 'Avatar', 500)
        ? await reconcileManagedReference(compatibility.avatar!, 'header')
        : undefined;
    const projects: Project[] = [];
    for (const project of normalizedProjects) {
      const images: string[] = [];
      for (const image of project.images ?? []) {
        images.push(await reconcileManagedReference(image, 'projects', true));
      }
      projects.push({
        ...project,
        images: images.length ? images : undefined,
      });
    }
    const exhibitions: Exhibition[] = [];
    for (const exhibition of normalizedExhibitions) {
      const images = await Promise.all(
        (exhibition.images ?? []).map((image) =>
          reconcileManagedReference(image, 'exhibitions')
        )
      );
      exhibitions.push({
        ...exhibition,
        images: images.length ? images : undefined,
      });
    }
    const awards: Award[] = [];
    for (const award of normalizedAwards) {
      const images = await Promise.all(
        (award.images ?? []).map((image) =>
          reconcileManagedReference(image, 'awards')
        )
      );
      awards.push({ ...award, images: images.length ? images : undefined });
    }
    const nextMediaProfile = { avatar, projects, exhibitions, awards };
    const previousImageIds = new Set(
      [...removedManagedMediaStorageIds(profile, nextMediaProfile)].map(
        mediaStorageId
      )
    );

    const accessFlags = getProfileAccessFlags(compatibility.accessMode);

    await ctx.db.patch(profile._id, {
      name: requiredText(args.name, 'Name', 120),
      avatar,
      title: optionalText(args.title, 'Title', 120),
      industry: optionalText(compatibility.industry, 'Industry', 120),
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
      languages,
      projects,
      publications,
      certifications,
      volunteering,
      exhibitions,
      awards,
      interests,
      ...(sectionsOrder ? { sectionsOrder } : {}),
      ...accessFlags,
      accessMode: compatibility.accessMode,
    });

    const updatedProfile = await ctx.db.get(profile._id);
    if (updatedProfile) await syncDirectoryProjection(ctx, updatedProfile);

    for (const upload of trackedUploads.values()) {
      if (
        upload.profileId !== profile._id ||
        upload.previewToken !== undefined
      ) {
        await ctx.db.patch(upload._id, {
          profileId: profile._id,
          previewToken: undefined,
        });
      }
    }

    for (const storageId of previousImageIds) {
      const upload = await ctx.db
        .query('uploadedFiles')
        .withIndex('by_storage', (q) => q.eq('storageId', storageId))
        .unique();
      if (upload?.userId === userId && upload.profileId === profile._id) {
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
