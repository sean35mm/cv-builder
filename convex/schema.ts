import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';
import { persistedProfileFieldValidators } from './profileValueValidators';

const applicationTables = {
  profiles: defineTable(persistedProfileFieldValidators)
    .index('by_user', ['userId'])
    .index('by_username', ['username'])
    .index('by_normalized_username', ['normalizedUsername']),

  publicDirectoryProfiles: defineTable({
    username: v.string(),
    name: v.string(),
    title: v.optional(v.string()),
    industry: v.optional(v.string()),
    skills: v.array(v.string()),
    searchText: v.string(),
  })
    .index('by_username', ['username'])
    .searchIndex('search_text', { searchField: 'searchText' }),

  publicDirectorySkills: defineTable({
    directoryUsername: v.string(),
    username: v.string(),
    name: v.string(),
    title: v.optional(v.string()),
    industry: v.optional(v.string()),
    skills: v.array(v.string()),
    skillKey: v.string(),
    searchText: v.string(),
  })
    .index('by_directory_username', ['directoryUsername'])
    .index('by_skill_and_username', ['skillKey', 'username'])
    .searchIndex('search_text', {
      searchField: 'searchText',
      filterFields: ['skillKey'],
    }),

  profileAnalytics: defineTable({
    profileId: v.id('profiles'),
    eventType: v.union(
      v.literal('view'),
      v.literal('pdf_download'),
      v.literal('link_click')
    ),
    referrer: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    linkType: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_and_created', ['profileId', 'createdAt'])
    .index('by_profile_and_type', ['profileId', 'eventType']),

  pdfDownloadReceipts: defineTable({
    receipt: v.string(),
    profileId: v.id('profiles'),
    callerHash: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_receipt', ['receipt'])
    .index('by_profile', ['profileId'])
    .index('by_expiration', ['expiresAt']),

  resumeVersions: defineTable({
    profileId: v.id('profiles'),
    name: v.string(),
    isDefault: v.boolean(),
    sectionsVisibility: v.record(v.string(), v.boolean()),
    sectionsOrder: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_default', ['profileId', 'isDefault']),

  contactMessages: defineTable({
    profileId: v.id('profiles'),
    senderName: v.string(),
    senderEmail: v.string(),
    subject: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    isReplied: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_and_read', ['profileId', 'isRead'])
    .index('by_created', ['createdAt']),

  testimonials: defineTable({
    profileId: v.id('profiles'),
    authorName: v.string(),
    authorEmail: v.string(),
    authorTitle: v.optional(v.string()),
    authorCompany: v.optional(v.string()),
    relationship: v.string(),
    content: v.string(),
    rating: v.optional(v.number()),
    isApproved: v.boolean(),
    requestToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    createdAt: v.number(),
    approvedAt: v.optional(v.number()),
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_and_approved', ['profileId', 'isApproved'])
    .index('by_profile_and_expiration', ['profileId', 'tokenExpiresAt'])
    .index('by_token', ['requestToken']),

  uploadedFiles: defineTable({
    storageId: v.id('_storage'),
    userId: v.id('users'),
    profileId: v.optional(v.id('profiles')),
    previewToken: v.optional(v.string()),
    contentType: v.string(),
    size: v.number(),
    createdAt: v.number(),
  })
    .index('by_storage', ['storageId'])
    .index('by_user', ['userId'])
    .index('by_user_and_created', ['userId', 'createdAt']),

  uploadSessions: defineTable({
    token: v.string(),
    userId: v.id('users'),
    createdAt: v.optional(v.number()),
    expiresAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_user', ['userId']),

  deletionJobs: defineTable({
    userId: v.id('users'),
    profileId: v.optional(v.id('profiles')),
    stage: v.union(
      v.literal('pdfReceipts'),
      v.literal('analytics'),
      v.literal('messages'),
      v.literal('versions'),
      v.literal('testimonials'),
      v.literal('trackedFiles'),
      v.literal('legacyFiles'),
      v.literal('uploadSessions'),
      v.literal('authSessions'),
      v.literal('authAccounts'),
      v.literal('finalAuthSessions'),
      v.literal('finalPdfReceipts'),
      v.literal('finalAnalytics'),
      v.literal('authRateLimits'),
      v.literal('profile'),
      v.literal('user')
    ),
    legacyStorageIds: v.array(v.id('_storage')),
    normalizedEmail: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    lastAttemptAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_updated_at', ['updatedAt']),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
