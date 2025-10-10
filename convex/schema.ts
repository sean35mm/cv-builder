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
