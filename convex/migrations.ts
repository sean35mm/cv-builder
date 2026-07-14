import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { internalMutation } from './_generated/server';
import {
  findCaseInsensitiveUsernameMatches,
  LEGACY_USERNAME_PREFLIGHT_LIMIT,
  USERNAME_MAINTENANCE_ERROR,
} from './usernameCollisions';

const MAX_BATCH_SIZE = 100;
const MIGRATABLE_USERNAME_PATTERN =
  /^(?:[a-z0-9_]{3,15}|[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?)$/;

const validateBatchSize = (numItems: number) => {
  if (
    !Number.isInteger(numItems) ||
    numItems < 1 ||
    numItems > MAX_BATCH_SIZE
  ) {
    throw new Error(
      `Migration batch size must be between 1 and ${MAX_BATCH_SIZE}`
    );
  }
};

export const reconcileDefaultVersionFlags = internalMutation({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    checked: v.number(),
    updated: v.number(),
  }),
  handler: async (ctx, args) => {
    validateBatchSize(args.paginationOpts.numItems);
    const page = await ctx.db
      .query('resumeVersions')
      .paginate(args.paginationOpts);
    let updated = 0;

    for (const version of page.page) {
      const profile = await ctx.db.get(version.profileId);
      const isDefault = profile?.defaultVersionId === version._id;
      if (version.isDefault !== isDefault) {
        await ctx.db.patch(version._id, { isDefault, updatedAt: Date.now() });
        updated += 1;
      }
    }

    return {
      continueCursor: page.continueCursor,
      isDone: page.isDone,
      checked: page.page.length,
      updated,
    };
  },
});

export const backfillNormalizedUsernames = internalMutation({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    checked: v.number(),
    updated: v.number(),
    collisions: v.array(v.id('profiles')),
    invalid: v.array(v.id('profiles')),
  }),
  handler: async (ctx, args) => {
    validateBatchSize(args.paginationOpts.numItems);
    const page = await ctx.db.query('profiles').paginate(args.paginationOpts);
    const legacyProfiles = await ctx.db
      .query('profiles')
      .take(LEGACY_USERNAME_PREFLIGHT_LIMIT + 1);
    if (legacyProfiles.length > LEGACY_USERNAME_PREFLIGHT_LIMIT) {
      throw new Error(USERNAME_MAINTENANCE_ERROR);
    }
    const collisions: Id<'profiles'>[] = [];
    const invalid: Id<'profiles'>[] = [];
    let updated = 0;

    for (const profile of page.page) {
      const candidate = profile.username.trim().toLowerCase();
      if (!MIGRATABLE_USERNAME_PATTERN.test(candidate)) {
        invalid.push(profile._id);
        continue;
      }
      const caseInsensitiveMatches = findCaseInsensitiveUsernameMatches(
        legacyProfiles,
        candidate
      );
      if (caseInsensitiveMatches.length > 1) {
        collisions.push(...caseInsensitiveMatches.map((match) => match._id));
        for (const match of caseInsensitiveMatches) {
          if (match.normalizedUsername !== undefined) {
            await ctx.db.patch(match._id, { normalizedUsername: undefined });
          }
        }
        continue;
      }
      if (
        profile.normalizedUsername !== undefined &&
        profile.normalizedUsername !== candidate
      ) {
        collisions.push(profile._id);
        continue;
      }

      const matches = await ctx.db
        .query('profiles')
        .withIndex('by_normalized_username', (q) =>
          q.eq('normalizedUsername', candidate)
        )
        .take(2);
      if (matches.some((match) => match._id !== profile._id)) {
        collisions.push(
          profile._id,
          ...matches
            .filter((match) => match._id !== profile._id)
            .map((match) => match._id)
        );
        for (const match of matches) {
          if (match.normalizedUsername !== undefined) {
            await ctx.db.patch(match._id, { normalizedUsername: undefined });
          }
        }
        continue;
      }

      if (profile.normalizedUsername === candidate) continue;

      await ctx.db.patch(profile._id, { normalizedUsername: candidate });
      updated += 1;
    }

    return {
      continueCursor: page.continueCursor,
      isDone: page.isDone,
      checked: page.page.length,
      updated,
      collisions: Array.from(new Set(collisions)),
      invalid,
    };
  },
});
