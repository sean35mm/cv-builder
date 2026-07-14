import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import type { EffectivePublicProfileState } from './publicProfiles';
import {
  persistedProfileFieldValidators,
  profileResponseFieldValidators,
} from './profileValueValidators';

export {
  awardValidator,
  certificationValidator,
  colorThemeValidator,
  educationValidator,
  exhibitionValidator,
  experienceValidator,
  projectValidator,
  volunteeringValidator,
} from './profileValueValidators';

export const profileDocValidator = v.object({
  _id: v.id('profiles'),
  _creationTime: v.number(),
  ...persistedProfileFieldValidators,
});

export const publicProfileValidator = v.object({
  _id: v.id('profiles'),
  _creationTime: v.number(),
  ...profileResponseFieldValidators,
  sectionsVisibility: v.record(v.string(), v.boolean()),
});

const STORAGE_IMAGE_PATTERN = /^(\/api\/storage\/[A-Za-z0-9_-]+)(?:\?.*)?$/;
export const PUBLIC_PROFILE_USERNAME_PATTERN =
  /^(?:[a-z0-9_]{3,15}|[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?)$/;

const publicImageUrl = (image: string, username: string): string => {
  const match = image.match(STORAGE_IMAGE_PATTERN);
  if (!match) return image;
  if (!PUBLIC_PROFILE_USERNAME_PATTERN.test(username)) return match[1];
  return `${match[1]}?profile=${username}`;
};

export function toPublicProfile(
  profile: Doc<'profiles'>,
  state: EffectivePublicProfileState
) {
  const {
    userId: _userId,
    defaultVersionId: _defaultVersionId,
    normalizedUsername: _normalizedUsername,
    name,
    title,
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
    projects,
    certifications,
    volunteering,
    exhibitions,
    awards,
    sectionsOrder: _sectionsOrder,
    ...publicFields
  } = profile;
  const visible = state.sectionsVisibility;
  const publicProjects = visible.projects
    ? projects?.map((project) => ({
        ...project,
        images: project.images?.map((image) =>
          publicImageUrl(image, publicFields.username)
        ),
      }))
    : undefined;

  return {
    ...publicFields,
    name: visible.header ? name : publicFields.username,
    ...(visible.header && title !== undefined ? { title } : {}),
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
    ...(publicProjects !== undefined ? { projects: publicProjects } : {}),
    ...(visible.certifications && certifications !== undefined
      ? { certifications }
      : {}),
    ...(visible.volunteering && volunteering !== undefined
      ? { volunteering }
      : {}),
    ...(visible.exhibitions && exhibitions !== undefined
      ? { exhibitions }
      : {}),
    ...(visible.awards && awards !== undefined ? { awards } : {}),
    sectionsOrder: state.sectionsOrder,
    sectionsVisibility: visible,
  };
}
