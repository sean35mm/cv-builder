import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

const applicationTables = {
  profiles: defineTable({
    userId: v.id('users'),
    username: v.string(),
    name: v.string(),
    title: v.optional(v.string()),
    location: v.optional(v.string()),
    bio: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    github: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    twitter: v.optional(v.string()),
    colorTheme: v.optional(
      v.union(
        v.literal('sage'),
        v.literal('ocean'),
        v.literal('rose'),
        v.literal('amber'),
        v.literal('slate'),
        v.literal('sand'),
        v.literal('cocoa'),
        v.literal('peach'),
        v.literal('forest'),
        v.literal('neutral'), // deprecated but accepted for migration
        v.literal('navy'), // deprecated but accepted for migration
        v.literal('olive'),
        v.literal('teal'),
        v.literal('mauve')
      )
    ),
    experience: v.array(
      v.object({
        id: v.string(),
        role: v.string(),
        company: v.string(),
        startDate: v.string(),
        endDate: v.optional(v.string()),
        current: v.boolean(),
        description: v.optional(v.string()),
      })
    ),
    education: v.array(
      v.object({
        id: v.string(),
        degree: v.string(),
        school: v.string(),
        startDate: v.string(),
        endDate: v.optional(v.string()),
        current: v.boolean(),
        description: v.optional(v.string()),
      })
    ),
    projects: v.optional(
      v.array(
        v.object({
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
        })
      )
    ),
    certifications: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          issuer: v.string(),
          year: v.optional(v.string()),
          credentialId: v.optional(v.string()),
          link: v.optional(v.string()),
          description: v.optional(v.string()),
        })
      )
    ),
    volunteering: v.optional(
      v.array(
        v.object({
          id: v.string(),
          role: v.string(),
          organization: v.string(),
          startDate: v.string(),
          endDate: v.optional(v.string()),
          current: v.boolean(),
          description: v.optional(v.string()),
        })
      )
    ),
    exhibitions: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          venue: v.optional(v.string()),
          year: v.string(),
          location: v.optional(v.string()),
          link: v.optional(v.string()),
          description: v.optional(v.string()),
        })
      )
    ),
    awards: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          issuer: v.string(),
          year: v.string(),
          link: v.optional(v.string()),
          description: v.optional(v.string()),
        })
      )
    ),
    skills: v.array(v.string()),
    sectionsOrder: v.optional(v.array(v.string())),
    templateId: v.optional(v.string()),
    isPublic: v.boolean(),
    defaultVersionId: v.optional(v.id('resumeVersions')),
    showPublicViewCount: v.optional(v.boolean()),
  })
    .index('by_user', ['userId'])
    .index('by_username', ['username']),

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
    .index('by_token', ['requestToken']),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
