import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';
import { persistedProfileFieldValidators } from './profileValueValidators';

const applicationTables = {
  profiles: defineTable(persistedProfileFieldValidators)
    .index('by_user', ['userId'])
    .index('by_username', ['username'])
    .index('by_normalized_username', ['normalizedUsername']),

  profileLocales: defineTable({
    profileId: v.id('profiles'),
    locale: v.string(),
    text: v.record(v.string(), v.string()),
    lists: v.record(v.string(), v.array(v.string())),
    updatedAt: v.number(),
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_locale', ['profileId', 'locale']),

  profilePasscodes: defineTable({
    profileId: v.id('profiles'),
    encodedHash: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_profile', ['profileId']),

  profileAccessGrants: defineTable({
    profileId: v.id('profiles'),
    tokenHash: v.string(),
    accessVersion: v.number(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_token_hash', ['tokenHash'])
    .index('by_profile', ['profileId'])
    .index('by_expiration', ['expiresAt']),

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
    deviceCategory: v.optional(
      v.union(
        v.literal('desktop'),
        v.literal('mobile'),
        v.literal('tablet'),
        v.literal('other')
      )
    ),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    linkType: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_profile', ['profileId'])
    .index('by_created', ['createdAt'])
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
    .index('by_expiration', ['tokenExpiresAt'])
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
    .index('by_user_and_created', ['userId', 'createdAt'])
    .index('by_profile_and_created', ['profileId', 'createdAt']),

  uploadSessions: defineTable({
    token: v.string(),
    userId: v.id('users'),
    profileId: v.optional(v.id('profiles')),
    contentType: v.optional(v.string()),
    expectedContentType: v.optional(v.string()),
    expectedSize: v.optional(v.number()),
    storageId: v.optional(v.id('_storage')),
    previewToken: v.optional(v.string()),
    state: v.optional(
      v.union(
        v.literal('reserved'),
        v.literal('uploaded'),
        v.literal('completed'),
        v.literal('aborted')
      )
    ),
    createdAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    expiresAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_user', ['userId'])
    .index('by_expiration', ['expiresAt']),

  customDomains: defineTable({
    hostname: v.string(),
    displayHostname: v.string(),
    userId: v.id('users'),
    profileId: v.id('profiles'),
    status: v.union(
      v.literal('pending_dns'),
      v.literal('pending_provider'),
      v.literal('pending_verification'),
      v.literal('active'),
      v.literal('misconfigured'),
      v.literal('reconciling'),
      v.literal('removing'),
      v.literal('remove_failed'),
      v.literal('removed')
    ),
    desiredState: v.union(v.literal('attached'), v.literal('detached')),
    challengeName: v.string(),
    challengeToken: v.string(),
    proofVerifiedAt: v.optional(v.number()),
    revision: v.number(),
    operationId: v.optional(v.string()),
    operationKind: v.optional(
      v.union(v.literal('verify'), v.literal('refresh'), v.literal('remove'))
    ),
    leaseExpiresAt: v.optional(v.number()),
    nextAttemptAt: v.optional(v.number()),
    attemptCount: v.number(),
    lastErrorCode: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    removedAt: v.optional(v.number()),
  })
    .index('by_hostname', ['hostname'])
    .index('by_profile', ['profileId'])
    .index('by_status_next_attempt', ['status', 'nextAttemptAt'])
    .index('by_operation', ['operationId']),

  deletionJobs: defineTable({
    userId: v.id('users'),
    profileId: v.optional(v.id('profiles')),
    stage: v.union(
      v.literal('customDomain'),
      v.literal('pdfReceipts'),
      v.literal('accessGrants'),
      v.literal('passcodes'),
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
      v.literal('locales'),
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
    .index('by_updated_at', ['updatedAt'])
    .index('by_created_at', ['createdAt']),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
