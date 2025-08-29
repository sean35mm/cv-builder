import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return profile;
  },
});

export const getProfileByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!profile || !profile.isPublic) {
      return null;
    }

    return profile;
  },
});

export const createProfile = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if username is already taken
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existingProfile) {
      throw new Error("Username already taken");
    }

    // Check if user already has a profile
    const userProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (userProfile) {
      throw new Error("User already has a profile");
    }

    const profileId = await ctx.db.insert("profiles", {
      userId,
      username: args.username,
      name: args.name,
      title: args.title,
      location: args.location,
      bio: args.bio,
      email: args.email,
      website: args.website,
      github: args.github,
      linkedin: args.linkedin,
      twitter: args.twitter,
      experience: [],
      education: [],
      skills: [],
      isPublic: false,
    });

    return profileId;
  },
});

export const updateProfile = mutation({
  args: {
    name: v.string(),
    title: v.optional(v.string()),
    location: v.optional(v.string()),
    bio: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    github: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    twitter: v.optional(v.string()),
    experience: v.array(v.object({
      id: v.string(),
      role: v.string(),
      company: v.string(),
      startDate: v.string(),
      endDate: v.optional(v.string()),
      current: v.boolean(),
      description: v.optional(v.string()),
    })),
    education: v.array(v.object({
      id: v.string(),
      degree: v.string(),
      school: v.string(),
      startDate: v.string(),
      endDate: v.optional(v.string()),
      current: v.boolean(),
      description: v.optional(v.string()),
    })),
    skills: v.array(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      name: args.name,
      title: args.title,
      location: args.location,
      bio: args.bio,
      email: args.email,
      website: args.website,
      github: args.github,
      linkedin: args.linkedin,
      twitter: args.twitter,
      experience: args.experience,
      education: args.education,
      skills: args.skills,
      isPublic: args.isPublic,
    });

    return profile._id;
  },
});

export const checkUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    return !profile;
  },
});
