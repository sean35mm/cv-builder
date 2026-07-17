import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import {
  internalMutation,
  internalQuery,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { ensureAccountActive } from './deletion';
import { rateLimiter } from './rateLimits';
import {
  canTransitionCustomDomain,
  customDomainRoutesPublicly,
  nextCustomDomainRetryAt,
  operationIsCurrent,
  type CustomDomainOperationKind,
  type CustomDomainStatus,
} from '../lib/custom-domains/lifecycle';

const OPERATION_LEASE_MS = 30_000;
const RECONCILE_LIMIT = 10;

const statusValidator = v.union(
  v.literal('pending_dns'),
  v.literal('pending_provider'),
  v.literal('pending_verification'),
  v.literal('active'),
  v.literal('misconfigured'),
  v.literal('reconciling'),
  v.literal('removing'),
  v.literal('remove_failed'),
  v.literal('removed')
);

const operationKindValidator = v.union(
  v.literal('verify'),
  v.literal('refresh'),
  v.literal('remove')
);

const ownerDomainValidator = v.object({
  id: v.id('customDomains'),
  hostname: v.string(),
  displayHostname: v.string(),
  status: statusValidator,
  desiredState: v.union(v.literal('attached'), v.literal('detached')),
  revision: v.number(),
  lastErrorCode: v.optional(v.string()),
  txt: v.optional(
    v.object({
      name: v.string(),
      value: v.string(),
      instructions: v.string(),
    })
  ),
});

const operationValidator = v.object({
  domainId: v.id('customDomains'),
  hostname: v.string(),
  challengeName: v.string(),
  challengeToken: v.string(),
  proofVerified: v.boolean(),
  revision: v.number(),
  operationId: v.string(),
  operationKind: operationKindValidator,
  desiredState: v.union(v.literal('attached'), v.literal('detached')),
});

const featureEnabled = (): boolean =>
  process.env.CUSTOM_DOMAINS_ENABLED === 'true';

const ownerDto = (domain: Doc<'customDomains'>) => ({
  id: domain._id,
  hostname: domain.hostname,
  displayHostname: domain.displayHostname,
  status: domain.status,
  desiredState: domain.desiredState,
  revision: domain.revision,
  lastErrorCode: domain.lastErrorCode,
  ...(domain.status === 'pending_dns' && !domain.proofVerifiedAt
    ? {
        txt: {
          name: domain.challengeName,
          value: `opencv-domain-verification=${domain.challengeToken}`,
          instructions:
            'Create this exact TXT record with your DNS provider, then verify it here.',
        },
      }
    : {}),
});

const ownedProfile = async (
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>
) => {
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique();
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  return profile;
};

export const getMine = query({
  args: {},
  returns: v.object({
    enabled: v.boolean(),
    domain: v.union(v.null(), ownerDomainValidator),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { enabled: featureEnabled(), domain: null };
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    if (!profile) return { enabled: featureEnabled(), domain: null };
    const domain = await ctx.db
      .query('customDomains')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .unique();
    return {
      enabled: featureEnabled(),
      domain: domain ? ownerDto(domain) : null,
    };
  },
});

export const resolveHost = query({
  args: { hostname: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      hostname: v.string(),
      profileId: v.id('profiles'),
      username: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    if (!featureEnabled() || !/^[a-z0-9.-]{1,253}$/.test(args.hostname)) {
      return null;
    }
    const domain = await ctx.db
      .query('customDomains')
      .withIndex('by_hostname', (q) => q.eq('hostname', args.hostname))
      .unique();
    if (!domain || !customDomainRoutesPublicly(domain)) return null;
    const profile = await ctx.db.get(domain.profileId);
    if (!profile || profile.userId !== domain.userId) return null;
    const deletion = await ctx.db
      .query('deletionJobs')
      .withIndex('by_user', (q) => q.eq('userId', domain.userId))
      .first();
    if (deletion) return null;
    return {
      hostname: domain.hostname,
      profileId: profile._id,
      username: profile.username,
    };
  },
});

export const resolveActiveForUsername = query({
  args: { username: v.string() },
  returns: v.union(v.null(), v.object({ hostname: v.string() })),
  handler: async (ctx, args) => {
    if (!featureEnabled()) return null;
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .unique();
    if (!profile) return null;
    const domain = await ctx.db
      .query('customDomains')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .unique();
    return domain && customDomainRoutesPublicly(domain)
      ? { hostname: domain.hostname }
      : null;
  },
});

export const claimForUser = internalMutation({
  args: {
    userId: v.id('users'),
    hostname: v.string(),
    displayHostname: v.string(),
    challengeName: v.string(),
    challengeToken: v.string(),
  },
  returns: ownerDomainValidator,
  handler: async (ctx, args) => {
    if (!featureEnabled()) throw new Error('FEATURE_DISABLED');
    await ensureAccountActive(ctx, args.userId);
    const profile = await ownedProfile(ctx, args.userId);
    const [hostnameOwner, profileDomain] = await Promise.all([
      ctx.db
        .query('customDomains')
        .withIndex('by_hostname', (q) => q.eq('hostname', args.hostname))
        .unique(),
      ctx.db
        .query('customDomains')
        .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
        .unique(),
    ]);
    if (hostnameOwner && hostnameOwner.userId !== args.userId) {
      throw new Error('DOMAIN_TAKEN');
    }
    if (profileDomain && profileDomain.hostname !== args.hostname) {
      throw new Error('DOMAIN_LIMIT');
    }
    const now = Date.now();
    if (profileDomain) {
      if (profileDomain.status !== 'removed') return ownerDto(profileDomain);
      await ctx.db.patch(profileDomain._id, {
        displayHostname: args.displayHostname,
        status: 'pending_dns',
        desiredState: 'attached',
        challengeName: args.challengeName,
        challengeToken: args.challengeToken,
        proofVerifiedAt: undefined,
        revision: profileDomain.revision + 1,
        operationId: undefined,
        operationKind: undefined,
        leaseExpiresAt: undefined,
        nextAttemptAt: undefined,
        attemptCount: 0,
        lastErrorCode: undefined,
        removedAt: undefined,
        updatedAt: now,
      });
      return ownerDto((await ctx.db.get(profileDomain._id))!);
    }
    const id = await ctx.db.insert('customDomains', {
      hostname: args.hostname,
      displayHostname: args.displayHostname,
      userId: args.userId,
      profileId: profile._id,
      status: 'pending_dns',
      desiredState: 'attached',
      challengeName: args.challengeName,
      challengeToken: args.challengeToken,
      revision: 1,
      attemptCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return ownerDto((await ctx.db.get(id))!);
  },
});

const operationResult = (
  domain: Doc<'customDomains'>,
  operationId: string,
  operationKind: CustomDomainOperationKind
) => ({
  domainId: domain._id,
  hostname: domain.hostname,
  challengeName: domain.challengeName,
  challengeToken: domain.challengeToken,
  proofVerified: Boolean(domain.proofVerifiedAt),
  revision: domain.revision + 1,
  operationId,
  operationKind,
  desiredState: operationKind === 'remove' ? ('detached' as const) : domain.desiredState,
});

export const beginOwnerOperation = internalMutation({
  args: {
    userId: v.id('users'),
    operationId: v.string(),
    operationKind: operationKindValidator,
  },
  returns: operationValidator,
  handler: async (ctx, args) => {
    if (!featureEnabled()) throw new Error('FEATURE_DISABLED');
    await ensureAccountActive(ctx, args.userId);
    const profile = await ownedProfile(ctx, args.userId);
    const domain = await ctx.db
      .query('customDomains')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .unique();
    if (!domain || domain.status === 'removed') throw new Error('DOMAIN_NOT_FOUND');
    await rateLimiter.limit(ctx, 'customDomainPerUser', {
      key: args.userId,
      throws: true,
    });
    const now = Date.now();
    if (domain.leaseExpiresAt && domain.leaseExpiresAt > now) {
      throw new Error('OPERATION_IN_PROGRESS');
    }
    if (args.operationKind === 'verify' && domain.proofVerifiedAt) {
      throw new Error('PROOF_ALREADY_VERIFIED');
    }
    if (args.operationKind === 'refresh' && !domain.proofVerifiedAt) {
      throw new Error('DNS_PROOF_REQUIRED');
    }
    const operation = operationResult(domain, args.operationId, args.operationKind);
    await ctx.db.patch(domain._id, {
      revision: operation.revision,
      operationId: args.operationId,
      operationKind: args.operationKind,
      leaseExpiresAt: now + OPERATION_LEASE_MS,
      nextAttemptAt: now + OPERATION_LEASE_MS,
      desiredState: operation.desiredState,
      ...(args.operationKind === 'remove' ? { status: 'removing' as const } : {}),
      lastErrorCode: undefined,
      updatedAt: now,
    });
    return operation;
  },
});

export const markProofVerified = internalMutation({
  args: {
    domainId: v.id('customDomains'),
    revision: v.number(),
    operationId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const domain = await ctx.db.get(args.domainId);
    if (!domain || !operationIsCurrent(domain, args)) return false;
    if (!canTransitionCustomDomain(domain.status, 'pending_provider')) return false;
    await ctx.db.patch(domain._id, {
      proofVerifiedAt: Date.now(),
      challengeToken: '',
      status: 'pending_provider',
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const failDnsVerification = internalMutation({
  args: {
    domainId: v.id('customDomains'),
    revision: v.number(),
    operationId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const domain = await ctx.db.get(args.domainId);
    if (!domain || !operationIsCurrent(domain, args) || domain.status !== 'pending_dns') {
      return false;
    }
    await ctx.db.patch(domain._id, {
      operationId: undefined,
      operationKind: undefined,
      leaseExpiresAt: undefined,
      nextAttemptAt: undefined,
      lastErrorCode: 'DNS_PROOF_NOT_FOUND',
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const completeProviderOperation = internalMutation({
  args: {
    domainId: v.id('customDomains'),
    revision: v.number(),
    operationId: v.string(),
    exists: v.boolean(),
    verified: v.boolean(),
    configured: v.boolean(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const domain = await ctx.db.get(args.domainId);
    if (!domain || !operationIsCurrent(domain, args) || !domain.operationKind) {
      return false;
    }
    let status: CustomDomainStatus;
    if (domain.desiredState === 'detached' || domain.operationKind === 'remove') {
      status = args.exists ? 'remove_failed' : 'removed';
    } else if (!args.exists) {
      status = 'reconciling';
    } else if (!args.verified) {
      status = 'pending_verification';
    } else {
      status = args.configured ? 'active' : 'misconfigured';
    }
    if (!canTransitionCustomDomain(domain.status, status)) return false;
    const now = Date.now();
    const needsRetry =
      status === 'reconciling' ||
      status === 'remove_failed' ||
      status === 'pending_verification' ||
      status === 'misconfigured';
    await ctx.db.patch(domain._id, {
      status,
      operationId: undefined,
      operationKind: undefined,
      leaseExpiresAt: undefined,
      attemptCount: needsRetry ? domain.attemptCount + 1 : 0,
      nextAttemptAt: needsRetry
        ? nextCustomDomainRetryAt(now, domain.attemptCount)
        : undefined,
      lastErrorCode:
        status === 'reconciling' || status === 'remove_failed'
          ? 'PROVIDER_STATE_UNCONFIRMED'
          : status === 'pending_verification'
            ? 'PROVIDER_VERIFICATION_PENDING'
            : status === 'misconfigured'
              ? 'DNS_CONFIGURATION_REQUIRED'
              : undefined,
      ...(status === 'removed' ? { removedAt: now } : {}),
      updatedAt: now,
    });
    return true;
  },
});

export const failProviderOperation = internalMutation({
  args: {
    domainId: v.id('customDomains'),
    revision: v.number(),
    operationId: v.string(),
    errorCode: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const domain = await ctx.db.get(args.domainId);
    if (!domain || !operationIsCurrent(domain, args)) return false;
    const status: CustomDomainStatus =
      domain.desiredState === 'detached' ? 'remove_failed' : 'reconciling';
    if (!canTransitionCustomDomain(domain.status, status)) return false;
    const now = Date.now();
    await ctx.db.patch(domain._id, {
      status,
      operationId: undefined,
      operationKind: undefined,
      leaseExpiresAt: undefined,
      attemptCount: domain.attemptCount + 1,
      nextAttemptAt: nextCustomDomainRetryAt(now, domain.attemptCount),
      lastErrorCode: args.errorCode.slice(0, 64),
      updatedAt: now,
    });
    return true;
  },
});

export const dueForReconciliation = internalQuery({
  args: {},
  returns: v.array(v.id('customDomains')),
  handler: async (ctx) => {
    const now = Date.now();
    const statuses: CustomDomainStatus[] = [
      'pending_provider',
      'pending_verification',
      'misconfigured',
      'reconciling',
      'remove_failed',
      'removing',
    ];
    const rows: Doc<'customDomains'>[] = [];
    for (const status of statuses) {
      const matches = await ctx.db
        .query('customDomains')
        .withIndex('by_status_next_attempt', (q) =>
          q.eq('status', status).lte('nextAttemptAt', now)
        )
        .take(RECONCILE_LIMIT);
      rows.push(...matches);
    }
    return rows
      .filter((row) => !row.leaseExpiresAt || row.leaseExpiresAt <= now)
      .slice(0, RECONCILE_LIMIT)
      .map((row) => row._id);
  },
});

export const beginSystemReconciliation = internalMutation({
  args: { domainId: v.id('customDomains'), operationId: v.string() },
  returns: v.union(v.null(), operationValidator),
  handler: async (ctx, args) => {
    const domain = await ctx.db.get(args.domainId);
    const now = Date.now();
    if (
      !domain ||
      domain.status === 'removed' ||
      (domain.leaseExpiresAt !== undefined && domain.leaseExpiresAt > now)
    ) {
      return null;
    }
    const operationKind: CustomDomainOperationKind =
      domain.desiredState === 'detached' ? 'remove' : 'refresh';
    const operation = operationResult(domain, args.operationId, operationKind);
    await ctx.db.patch(domain._id, {
      revision: operation.revision,
      operationId: args.operationId,
      operationKind,
      leaseExpiresAt: now + OPERATION_LEASE_MS,
      status: operationKind === 'remove' ? 'removing' : 'reconciling',
      nextAttemptAt: now + OPERATION_LEASE_MS,
      updatedAt: now,
    });
    return operation;
  },
});
