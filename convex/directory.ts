import { query, type MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { resolveEffectivePublicProfileState } from './publicProfiles';
import {
  createDirectoryProjection,
  normalizeDirectoryCursor,
  normalizeDirectoryPageSize,
  normalizeDirectoryQuery,
  normalizeDirectorySkill,
  toDirectoryProfileDto,
} from './directoryProjection';

const directoryProfileValidator = v.object({
  username: v.string(),
  name: v.string(),
  title: v.optional(v.string()),
  industry: v.optional(v.string()),
  skills: v.array(v.string()),
});

const directoryPageValidator = v.object({
  items: v.array(directoryProfileValidator),
  continueCursor: v.union(v.string(), v.null()),
  isDone: v.boolean(),
});

const toDirectoryProfile = (
  profile: Doc<'publicDirectoryProfiles'> | Doc<'publicDirectorySkills'>
) =>
  toDirectoryProfileDto({
    username: profile.username,
    name: profile.name,
    ...(profile.title ? { title: profile.title } : {}),
    ...(profile.industry ? { industry: profile.industry } : {}),
    skills: profile.skills,
    searchText: profile.searchText,
  });

const removeDirectoryProjection = async (
  ctx: MutationCtx,
  username: string
) => {
  const profile = await ctx.db
    .query('publicDirectoryProfiles')
    .withIndex('by_username', (q) => q.eq('username', username))
    .unique();
  if (profile) await ctx.db.delete(profile._id);

  const skills = await ctx.db
    .query('publicDirectorySkills')
    .withIndex('by_directory_username', (q) =>
      q.eq('directoryUsername', username)
    )
    .collect();
  for (const skill of skills) await ctx.db.delete(skill._id);
};

export const syncDirectoryProjection = async (
  ctx: MutationCtx,
  profile: Doc<'profiles'>
) => {
  await removeDirectoryProjection(ctx, profile.username);
  const state = await resolveEffectivePublicProfileState(ctx, profile);
  const projection = createDirectoryProjection(profile, state);
  if (!projection) return;

  await ctx.db.insert('publicDirectoryProfiles', projection);
  for (const skill of projection.skills) {
    const skillKey = normalizeDirectorySkill(skill);
    if (!skillKey) continue;
    await ctx.db.insert('publicDirectorySkills', {
      directoryUsername: projection.username,
      ...projection,
      skillKey,
    });
  }
};

export const removeDirectoryProjectionForProfile = async (
  ctx: MutationCtx,
  profile: Doc<'profiles'>
) => removeDirectoryProjection(ctx, profile.username);

export const list = query({
  args: {
    cursor: v.optional(v.string()),
    pageSize: v.optional(v.number()),
    query: v.optional(v.string()),
    skill: v.optional(v.string()),
  },
  returns: directoryPageValidator,
  handler: async (ctx, args) => {
    const pageSize = normalizeDirectoryPageSize(args.pageSize);
    const searchQuery = normalizeDirectoryQuery(args.query);
    const skill = normalizeDirectorySkill(args.skill);
    const paginationOpts = {
      cursor: normalizeDirectoryCursor(args.cursor) ?? null,
      numItems: pageSize,
    };

    if (skill) {
      const page = searchQuery
        ? await ctx.db
            .query('publicDirectorySkills')
            .withSearchIndex('search_text', (q) =>
              q.search('searchText', searchQuery).eq('skillKey', skill)
            )
            .paginate(paginationOpts)
        : await ctx.db
            .query('publicDirectorySkills')
            .withIndex('by_skill_and_username', (q) => q.eq('skillKey', skill))
            .paginate(paginationOpts);
      return {
        items: page.page.map(toDirectoryProfile),
        continueCursor: page.continueCursor,
        isDone: page.isDone,
      };
    }

    const page = searchQuery
      ? await ctx.db
          .query('publicDirectoryProfiles')
          .withSearchIndex('search_text', (q) =>
            q.search('searchText', searchQuery)
          )
          .paginate(paginationOpts)
      : await ctx.db
          .query('publicDirectoryProfiles')
          .withIndex('by_username')
          .paginate(paginationOpts);
    return {
      items: page.page.map(toDirectoryProfile),
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});
