import { v } from 'convex/values';

export const colorThemeValidator = v.union(
  v.literal('sage'),
  v.literal('ocean'),
  v.literal('rose'),
  v.literal('amber'),
  v.literal('slate'),
  v.literal('sand'),
  v.literal('cocoa'),
  v.literal('peach'),
  v.literal('forest'),
  v.literal('neutral'),
  v.literal('navy'),
  v.literal('olive'),
  v.literal('teal'),
  v.literal('mauve')
);

export const profileFontValidator = v.union(
  v.literal('default'),
  v.literal('sans'),
  v.literal('serif'),
  v.literal('mono')
);

export const profileAccessModeValidator = v.union(
  v.literal('private'),
  v.literal('passcode'),
  v.literal('unlisted'),
  v.literal('public')
);

export const experienceValidator = v.object({
  id: v.string(),
  role: v.string(),
  company: v.string(),
  startDate: v.string(),
  endDate: v.optional(v.string()),
  current: v.boolean(),
  description: v.optional(v.string()),
});

export const educationValidator = v.object({
  id: v.string(),
  degree: v.string(),
  school: v.string(),
  startDate: v.string(),
  endDate: v.optional(v.string()),
  current: v.boolean(),
  description: v.optional(v.string()),
});

export const projectValidator = v.object({
  id: v.string(),
  title: v.string(),
  year: v.string(),
  company: v.optional(v.string()),
  link: v.optional(v.string()),
  description: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  technologies: v.optional(v.array(v.string())),
  category: v.optional(v.string()),
  isFeatured: v.optional(v.boolean()),
});

export const certificationValidator = v.object({
  id: v.string(),
  name: v.string(),
  issuer: v.string(),
  year: v.optional(v.string()),
  credentialId: v.optional(v.string()),
  link: v.optional(v.string()),
  description: v.optional(v.string()),
});

export const languageProficiencyValidator = v.union(
  v.literal('native'),
  v.literal('fluent'),
  v.literal('professional'),
  v.literal('conversational'),
  v.literal('basic')
);

export const languageValidator = v.object({
  id: v.string(),
  name: v.string(),
  proficiency: v.optional(languageProficiencyValidator),
});

export const publicationValidator = v.object({
  id: v.string(),
  title: v.string(),
  publisher: v.optional(v.string()),
  date: v.optional(v.string()),
  url: v.optional(v.string()),
  authors: v.optional(v.array(v.string())),
  description: v.optional(v.string()),
});

export const volunteeringValidator = v.object({
  id: v.string(),
  role: v.string(),
  organization: v.string(),
  startDate: v.string(),
  endDate: v.optional(v.string()),
  current: v.boolean(),
  description: v.optional(v.string()),
});

export const exhibitionValidator = v.object({
  id: v.string(),
  title: v.string(),
  venue: v.optional(v.string()),
  year: v.string(),
  location: v.optional(v.string()),
  link: v.optional(v.string()),
  description: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
});

export const awardValidator = v.object({
  id: v.string(),
  title: v.string(),
  issuer: v.string(),
  year: v.string(),
  link: v.optional(v.string()),
  description: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
});

const profileTextFieldValidators = {
  name: v.string(),
  avatar: v.optional(v.string()),
  title: v.optional(v.string()),
  industry: v.optional(v.string()),
  location: v.optional(v.string()),
  bio: v.optional(v.string()),
  email: v.optional(v.string()),
  website: v.optional(v.string()),
  github: v.optional(v.string()),
  linkedin: v.optional(v.string()),
  twitter: v.optional(v.string()),
};

const persistedProfileCollectionFieldValidators = {
  experience: v.array(experienceValidator),
  education: v.array(educationValidator),
  projects: v.optional(v.array(projectValidator)),
  languages: v.optional(v.array(languageValidator)),
  publications: v.optional(v.array(publicationValidator)),
  certifications: v.optional(v.array(certificationValidator)),
  volunteering: v.optional(v.array(volunteeringValidator)),
  exhibitions: v.optional(v.array(exhibitionValidator)),
  awards: v.optional(v.array(awardValidator)),
  skills: v.array(v.string()),
  interests: v.optional(v.array(v.string())),
};

export const profileResponseFieldValidators = {
  username: v.string(),
  ...profileTextFieldValidators,
  colorTheme: v.optional(colorThemeValidator),
  headingFont: v.optional(profileFontValidator),
  bodyFont: v.optional(profileFontValidator),
  ...persistedProfileCollectionFieldValidators,
  sectionsOrder: v.optional(v.array(v.string())),
  templateId: v.optional(v.string()),
  isPublic: v.boolean(),
  showPublicViewCount: v.optional(v.boolean()),
  allowEmbed: v.optional(v.boolean()),
  analyticsEnabled: v.optional(v.boolean()),
  analyticsDigestOptIn: v.optional(v.boolean()),
  defaultLocale: v.optional(v.string()),
  locales: v.optional(v.array(v.string())),
};

export const persistedProfileFieldValidators = {
  userId: v.id('users'),
  ...profileResponseFieldValidators,
  headingFont: v.optional(v.string()),
  bodyFont: v.optional(v.string()),
  isDirectoryListed: v.optional(v.boolean()),
  normalizedUsername: v.optional(v.string()),
  defaultVersionId: v.optional(v.id('resumeVersions')),
  accessMode: v.optional(profileAccessModeValidator),
  accessVersion: v.optional(v.number()),
};

export const updateProfileArgsValidatorFields = {
  ...profileTextFieldValidators,
  experience: v.array(experienceValidator),
  education: v.array(educationValidator),
  skills: v.array(v.string()),
  languages: v.optional(v.array(languageValidator)),
  projects: v.array(projectValidator),
  publications: v.optional(v.array(publicationValidator)),
  certifications: v.array(certificationValidator),
  volunteering: v.array(volunteeringValidator),
  exhibitions: v.array(exhibitionValidator),
  awards: v.array(awardValidator),
  interests: v.optional(v.array(v.string())),
  sectionsOrder: v.optional(v.array(v.string())),
  isPublic: v.boolean(),
  isDirectoryListed: v.optional(v.boolean()),
};
