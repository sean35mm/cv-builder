import { v } from 'convex/values';
import { resolveProfileTypography } from '../lib/profile/typography';
import { resolveProfileAccessMode } from '../lib/profile/access';
import type { Doc } from './_generated/dataModel';
import type { EffectivePublicProfileState } from './publicProfiles';
import { parseManagedMediaUrl } from '../lib/profile/media';
import {
  profileFontValidator,
  profileResponseFieldValidators,
} from './profileValueValidators';

export {
  awardValidator,
  certificationValidator,
  colorThemeValidator,
  educationValidator,
  exhibitionValidator,
  experienceValidator,
  languageProficiencyValidator,
  languageValidator,
  projectValidator,
  publicationValidator,
  profileFontValidator,
  volunteeringValidator,
} from './profileValueValidators';

export const profileDocValidator = v.object({
  _id: v.id('profiles'),
  _creationTime: v.number(),
  userId: v.id('users'),
  ...profileResponseFieldValidators,
  isDirectoryListed: v.optional(v.boolean()),
  normalizedUsername: v.optional(v.string()),
  defaultVersionId: v.optional(v.id('resumeVersions')),
  accessMode: v.optional(
    v.union(
      v.literal('private'),
      v.literal('passcode'),
      v.literal('unlisted'),
      v.literal('public')
    )
  ),
  accessVersion: v.optional(v.number()),
});

const {
  isPublic: _isPublicValidator,
  ...publicProfileResponseFieldValidators
} = profileResponseFieldValidators;

export const publicProfileValidator = v.object({
  _id: v.id('profiles'),
  _creationTime: v.number(),
  ...publicProfileResponseFieldValidators,
  headingFont: profileFontValidator,
  bodyFont: profileFontValidator,
  sectionsVisibility: v.record(v.string(), v.boolean()),
  accessMode: v.union(v.literal('unlisted'), v.literal('public')),
});

export const PUBLIC_PROFILE_USERNAME_PATTERN =
  /^(?:[a-z0-9_]{3,15}|[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?)$/;

const publicManagedImageUrl = (
  image: string,
  username: string
): string | null => {
  const reference = parseManagedMediaUrl(image);
  if (!reference) return null;
  if (!PUBLIC_PROFILE_USERNAME_PATTERN.test(username)) {
    return reference.canonicalUrl;
  }
  return `${reference.canonicalUrl}?profile=${username}`;
};

const publicProjectImageUrl = (
  image: string,
  username: string
): string | null =>
  publicManagedImageUrl(image, username) ??
  (image.startsWith('/api/storage/') ? null : image);

function toProfilePresentation(
  profile: Doc<'profiles'>,
  state: EffectivePublicProfileState,
  allowPasscode: boolean
) {
  const accessMode = resolveProfileAccessMode(
    profile.isPublic,
    profile.isDirectoryListed,
    profile.accessMode
  );
  if (
    accessMode === 'private' ||
    (!allowPasscode && accessMode === 'passcode')
  ) {
    throw new Error('Private profile cannot be projected publicly');
  }
  const {
    userId: _userId,
    defaultVersionId: _defaultVersionId,
    normalizedUsername: _normalizedUsername,
    accessMode: _persistedAccessMode,
    accessVersion: _accessVersion,
    isPublic: _isPublic,
    isDirectoryListed: _isDirectoryListed,
    headingFont,
    bodyFont,
    name,
    avatar,
    title,
    industry,
    location,
    bio,
    email,
    website,
    github,
    linkedin,
    twitter,
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
    sectionsOrder: _sectionsOrder,
    ...publicFields
  } = profile;
  const visible = state.sectionsVisibility;
  const publicProjects = visible.projects
    ? projects?.map((project) => ({
        ...project,
        images: project.images
          ?.map((image) => publicProjectImageUrl(image, publicFields.username))
          .filter((image): image is string => image !== null),
      }))
    : undefined;
  const publicExhibitions = visible.exhibitions
    ? exhibitions?.map((exhibition) => ({
        ...exhibition,
        images: exhibition.images
          ?.map((image) => publicManagedImageUrl(image, publicFields.username))
          .filter((image): image is string => image !== null),
      }))
    : undefined;
  const publicAwards = visible.awards
    ? awards?.map((award) => ({
        ...award,
        images: award.images
          ?.map((image) => publicManagedImageUrl(image, publicFields.username))
          .filter((image): image is string => image !== null),
      }))
    : undefined;
  const publicAvatar =
    visible.header && avatar
      ? publicManagedImageUrl(avatar, publicFields.username)
      : null;

  return {
    ...publicFields,
    ...resolveProfileTypography({ headingFont, bodyFont }),
    name: visible.header ? name : publicFields.username,
    ...(publicAvatar ? { avatar: publicAvatar } : {}),
    ...(visible.header && title !== undefined ? { title } : {}),
    ...(visible.header && industry !== undefined ? { industry } : {}),
    ...(visible.header && location !== undefined ? { location } : {}),
    ...(visible.bio && bio !== undefined ? { bio } : {}),
    ...(visible.contact && email !== undefined ? { email } : {}),
    ...(visible.contact && website !== undefined ? { website } : {}),
    ...(visible.contact && github !== undefined ? { github } : {}),
    ...(visible.contact && linkedin !== undefined ? { linkedin } : {}),
    ...(visible.contact && twitter !== undefined ? { twitter } : {}),
    experience: visible.experience ? experience : [],
    education: visible.education ? education : [],
    skills: visible.skills ? skills : [],
    ...(visible.languages && languages !== undefined ? { languages } : {}),
    ...(publicProjects !== undefined ? { projects: publicProjects } : {}),
    ...(visible.publications && publications !== undefined
      ? { publications }
      : {}),
    ...(visible.certifications && certifications !== undefined
      ? { certifications }
      : {}),
    ...(visible.volunteering && volunteering !== undefined
      ? { volunteering }
      : {}),
    ...(publicExhibitions !== undefined
      ? { exhibitions: publicExhibitions }
      : {}),
    ...(publicAwards !== undefined ? { awards: publicAwards } : {}),
    ...(visible.interests && interests !== undefined ? { interests } : {}),
    sectionsOrder: state.sectionsOrder,
    sectionsVisibility: visible,
    accessMode,
  };
}

export function toPublicProfile(
  profile: Doc<'profiles'>,
  state: EffectivePublicProfileState
) {
  const result = toProfilePresentation(profile, state, false);
  return {
    ...result,
    accessMode: result.accessMode as 'unlisted' | 'public',
  };
}

export function toAuthorizedProfile(
  profile: Doc<'profiles'>,
  state: EffectivePublicProfileState
) {
  return toProfilePresentation(profile, state, true);
}
