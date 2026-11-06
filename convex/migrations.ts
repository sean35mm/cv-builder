import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { internalMutation, internalQuery } from './_generated/server';
import {
  assertBoundedLegacyProfileSample,
  findCaseInsensitiveUsernameMatches,
  findLegacyNormalizedUsernameConflicts,
  LEGACY_USERNAME_PREFLIGHT_LIMIT,
  USERNAME_MAINTENANCE_ERROR,
} from './usernameCollisions';
import {
  getUsernameVerification,
  invalidateUsernameVerification,
  USERNAME_VERIFICATION_KEY,
} from './usernameVerification';
import {
  classifyUsernameAuditRecord,
  expectedNormalizedUsername,
  isSafeNormalizedUsername,
  planExplicitUsernameMigrations,
  USERNAME_AUDIT_MAX_PAGE_SIZE,
  USERNAME_MIGRATION_MAX_BATCH_SIZE,
} from './usernameMaintenance';

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

const usernameAuditRecordValidator = v.object({
  profileId: v.id('profiles'),
  username: v.string(),
  normalizedUsername: v.optional(v.string()),
  expectedNormalizedUsername: v.string(),
});

const usernameMigrationErrorValidator = v.object({
  entryIndex: v.number(),
  profileId: v.optional(v.id('profiles')),
  code: v.string(),
  message: v.string(),
});

const plannedUsernameMigrationValidator = v.object({
  profileId: v.id('profiles'),
  expectedCurrentUsername: v.string(),
  approvedUsername: v.string(),
  previousNormalizedUsername: v.optional(v.string()),
});

// Call once with restart:true, then restart:false until verified or blocked.
// The cursor lives in the transaction, so retries and lost responses cannot
// skip pages. Identity writes invalidate checking state in the same transaction.
export const verifyNormalizedUsernames = internalMutation({
  args: { restart: v.boolean(), numItems: v.number() },
  returns: v.object({
    status: v.union(
      v.literal('checking'),
      v.literal('verified'),
      v.literal('blocked')
    ),
    checked: v.number(),
    issues: v.number(),
    problemProfileIds: v.array(v.id('profiles')),
  }),
  handler: async (ctx, args) => {
    validateBatchSize(args.numItems);
    const state = await getUsernameVerification(ctx);
    if (!args.restart && (!state || state.status === 'unverified')) {
      throw new Error('Username verification must be restarted');
    }
    if (
      !args.restart &&
      state &&
      (state.status === 'verified' || state.status === 'blocked')
    ) {
      return {
        status: state.status,
        checked: state.checked,
        issues: state.issues,
        problemProfileIds: [],
      };
    }

    const page = await ctx.db.query('profiles').paginate({
      cursor: args.restart ? null : state!.cursor,
      numItems: args.numItems,
    });
    const problemProfileIds: Id<'profiles'>[] = [];
    for (const profile of page.page) {
      const expected = expectedNormalizedUsername(profile.username);
      const matches = await ctx.db
        .query('profiles')
        .withIndex('by_normalized_username', (q) =>
          q.eq('normalizedUsername', expected)
        )
        .take(2);
      if (
        !isSafeNormalizedUsername(expected) ||
        profile.normalizedUsername !== expected ||
        matches.some((match) => match._id !== profile._id)
      ) {
        problemProfileIds.push(profile._id);
      }
    }
    const checked = (args.restart ? 0 : state!.checked) + page.page.length;
    const issues =
      (args.restart ? 0 : state!.issues) + problemProfileIds.length;
    const status = page.isDone
      ? issues === 0
        ? ('verified' as const)
        : ('blocked' as const)
      : ('checking' as const);
    const next = {
      key: USERNAME_VERIFICATION_KEY,
      status,
      cursor: page.isDone ? null : page.continueCursor,
      checked,
      issues,
    };
    if (state) await ctx.db.patch(state._id, next);
    else await ctx.db.insert('usernameVerification', next);

    return { status, checked, issues, problemProfileIds };
  },
});

// Revoke the certificate before any separately approved manual identity repair.
export const resetUsernameVerification = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await invalidateUsernameVerification(ctx);
    return null;
  },
});

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

// Unverified datasets above the legacy limit need a full paginated audit and
// separately approved per-profile repairs, after resetUsernameVerification.
// Never set verified state manually: restart verification after repairs. A
// complete large dataset can certify directly; this backfill then stays bounded.
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
    const verification = await getUsernameVerification(ctx);
    const legacyProfiles =
      verification?.status === 'verified'
        ? []
        : await ctx.db
            .query('profiles')
            .take(LEGACY_USERNAME_PREFLIGHT_LIMIT + 1);
    if (legacyProfiles.length > LEGACY_USERNAME_PREFLIGHT_LIMIT) {
      throw new Error(USERNAME_MAINTENANCE_ERROR);
    }
    const collisions: Id<'profiles'>[] = [];
    const invalid: Id<'profiles'>[] = [];
    let updated = 0;
    let invalidated = false;
    const invalidate = async () => {
      if (invalidated) return;
      await invalidateUsernameVerification(ctx);
      invalidated = true;
    };

    for (const profile of page.page) {
      const candidate = profile.username.trim().toLowerCase();
      if (!MIGRATABLE_USERNAME_PATTERN.test(candidate)) {
        await invalidate();
        invalid.push(profile._id);
        continue;
      }
      const caseInsensitiveMatches = findCaseInsensitiveUsernameMatches(
        legacyProfiles,
        candidate
      );
      if (caseInsensitiveMatches.length > 1) {
        await invalidate();
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
        await invalidate();
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
        await invalidate();
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

      await invalidate();
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

export const auditNormalizedUsernames = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    totalSampled: v.number(),
    complete: v.boolean(),
    cursor: v.union(v.string(), v.null()),
    counts: v.object({
      missingNormalizedUsername: v.number(),
      mismatch: v.number(),
      invalidUsername: v.number(),
      normalizedCollisions: v.number(),
    }),
    records: v.object({
      missingNormalizedUsername: v.array(usernameAuditRecordValidator),
      mismatch: v.array(usernameAuditRecordValidator),
      invalidUsername: v.array(usernameAuditRecordValidator),
      normalizedCollisions: v.array(usernameAuditRecordValidator),
    }),
  }),
  handler: async (ctx, args) => {
    const { numItems } = args.paginationOpts;
    if (
      !Number.isInteger(numItems) ||
      numItems < 1 ||
      numItems > USERNAME_AUDIT_MAX_PAGE_SIZE
    ) {
      throw new Error(
        `Username audit page size must be between 1 and ${USERNAME_AUDIT_MAX_PAGE_SIZE}`
      );
    }

    const page = await ctx.db.query('profiles').paginate(args.paginationOpts);
    const records = {
      missingNormalizedUsername: [] as Array<{
        profileId: Id<'profiles'>;
        username: string;
        normalizedUsername?: string;
        expectedNormalizedUsername: string;
      }>,
      mismatch: [] as Array<{
        profileId: Id<'profiles'>;
        username: string;
        normalizedUsername?: string;
        expectedNormalizedUsername: string;
      }>,
      invalidUsername: [] as Array<{
        profileId: Id<'profiles'>;
        username: string;
        normalizedUsername?: string;
        expectedNormalizedUsername: string;
      }>,
      normalizedCollisions: [] as Array<{
        profileId: Id<'profiles'>;
        username: string;
        normalizedUsername?: string;
        expectedNormalizedUsername: string;
      }>,
    };

    for (const profile of page.page) {
      const expected = expectedNormalizedUsername(profile.username);
      const normalizedValues = new Set([expected]);
      if (profile.normalizedUsername !== undefined) {
        normalizedValues.add(profile.normalizedUsername);
      }
      let hasNormalizedCollision = false;
      for (const normalizedValue of normalizedValues) {
        const matches = await ctx.db
          .query('profiles')
          .withIndex('by_normalized_username', (q) =>
            q.eq('normalizedUsername', normalizedValue)
          )
          .take(2);
        if (matches.some((match) => match._id !== profile._id)) {
          hasNormalizedCollision = true;
          break;
        }
      }

      const classification = classifyUsernameAuditRecord(
        {
          profileId: profile._id,
          username: profile.username,
          normalizedUsername: profile.normalizedUsername,
        },
        hasNormalizedCollision
      );
      if (classification.missingNormalizedUsername) {
        records.missingNormalizedUsername.push(classification.record);
      }
      if (classification.mismatch) records.mismatch.push(classification.record);
      if (classification.invalidUsername) {
        records.invalidUsername.push(classification.record);
      }
      if (classification.normalizedCollision) {
        records.normalizedCollisions.push(classification.record);
      }
    }

    return {
      totalSampled: page.page.length,
      complete: page.isDone,
      cursor: page.isDone ? null : page.continueCursor,
      counts: {
        missingNormalizedUsername: records.missingNormalizedUsername.length,
        mismatch: records.mismatch.length,
        invalidUsername: records.invalidUsername.length,
        normalizedCollisions: records.normalizedCollisions.length,
      },
      records,
    };
  },
});

export const applyApprovedUsernameMigrations = internalMutation({
  args: {
    entries: v.array(
      v.object({
        profileId: v.id('profiles'),
        expectedCurrentUsername: v.string(),
        approvedUsername: v.string(),
      })
    ),
    dryRun: v.boolean(),
  },
  returns: v.object({
    dryRun: v.boolean(),
    valid: v.boolean(),
    plannedChanges: v.array(plannedUsernameMigrationValidator),
    errors: v.array(usernameMigrationErrorValidator),
    applied: v.number(),
  }),
  handler: async (ctx, args) => {
    if (
      args.entries.length < 1 ||
      args.entries.length > USERNAME_MIGRATION_MAX_BATCH_SIZE
    ) {
      const plan = planExplicitUsernameMigrations(args.entries, []);
      return {
        dryRun: args.dryRun,
        valid: false,
        plannedChanges: plan.plannedChanges,
        errors: plan.errors,
        applied: 0,
      };
    }

    const verification = await getUsernameVerification(ctx);
    const legacyProfiles =
      verification?.status === 'verified'
        ? []
        : await ctx.db
            .query('profiles')
            .take(LEGACY_USERNAME_PREFLIGHT_LIMIT + 1);
    assertBoundedLegacyProfileSample(legacyProfiles);
    const legacyNormalizedConflictProfileIds =
      findLegacyNormalizedUsernameConflicts(
        legacyProfiles,
        args.entries.map((entry) => entry.approvedUsername)
      );
    const states = [];
    for (const entry of args.entries) {
      const profile = await ctx.db.get(entry.profileId);
      const approvedUsernameIsSafe = isSafeNormalizedUsername(
        entry.approvedUsername
      );
      const normalizedMatches = approvedUsernameIsSafe
        ? await ctx.db
            .query('profiles')
            .withIndex('by_normalized_username', (q) =>
              q.eq('normalizedUsername', entry.approvedUsername)
            )
            .take(2)
        : [];
      const exactMatches = approvedUsernameIsSafe
        ? await ctx.db
            .query('profiles')
            .withIndex('by_username', (q) =>
              q.eq('username', entry.approvedUsername)
            )
            .take(2)
        : [];
      const owner = profile ? await ctx.db.get(profile.userId) : null;
      const sourceDirectoryProfile = profile
        ? await ctx.db
            .query('publicDirectoryProfiles')
            .withIndex('by_username', (q) => q.eq('username', profile.username))
            .first()
        : null;
      const sourceDirectorySkill = profile
        ? await ctx.db
            .query('publicDirectorySkills')
            .withIndex('by_directory_username', (q) =>
              q.eq('directoryUsername', profile.username)
            )
            .first()
        : null;
      const targetDirectoryProfile = approvedUsernameIsSafe
        ? await ctx.db
            .query('publicDirectoryProfiles')
            .withIndex('by_username', (q) =>
              q.eq('username', entry.approvedUsername)
            )
            .first()
        : null;
      const targetDirectorySkill = approvedUsernameIsSafe
        ? await ctx.db
            .query('publicDirectorySkills')
            .withIndex('by_directory_username', (q) =>
              q.eq('directoryUsername', entry.approvedUsername)
            )
            .first()
        : null;
      states.push({
        profileId: entry.profileId,
        currentUsername: profile?.username,
        currentNormalizedUsername: profile?.normalizedUsername,
        ownerExists: Boolean(owner),
        hasDirectoryProjection: Boolean(
          sourceDirectoryProfile ||
          sourceDirectorySkill ||
          targetDirectoryProfile ||
          targetDirectorySkill
        ),
        normalizedConflictProfileIds: [
          ...normalizedMatches.map((match) => match._id),
          ...(legacyNormalizedConflictProfileIds.get(entry.approvedUsername) ??
            []),
        ],
        exactConflictProfileIds: exactMatches.map((match) => match._id),
      });
    }

    const plan = planExplicitUsernameMigrations(args.entries, states);
    if (args.dryRun || plan.errors.length > 0) {
      return {
        dryRun: args.dryRun,
        valid: plan.errors.length === 0,
        plannedChanges: plan.plannedChanges,
        errors: plan.errors,
        applied: 0,
      };
    }

    if (plan.plannedChanges.length > 0) {
      await invalidateUsernameVerification(ctx, true);
    }
    for (const change of plan.plannedChanges) {
      await ctx.db.patch(change.profileId, {
        username: change.approvedUsername,
        normalizedUsername: change.approvedUsername,
      });
    }
    return {
      dryRun: false,
      valid: true,
      plannedChanges: plan.plannedChanges,
      errors: [],
      applied: plan.plannedChanges.length,
    };
  },
});
