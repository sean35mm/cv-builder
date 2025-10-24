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
    isPublic: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_username', ['username']),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
