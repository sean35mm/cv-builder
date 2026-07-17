'use node';

import { getAuthUserId } from '@convex-dev/auth/server';
import { isRateLimitError } from '@convex-dev/rate-limiter';
import { randomBytes, randomUUID } from 'node:crypto';
import { resolveTxt } from 'node:dns/promises';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import {
  action,
  internalAction,
  type ActionCtx,
} from './_generated/server';
import {
  customDomainChallengeName,
  customDomainProofValue,
  txtRecordsContainExactProof,
} from '../lib/custom-domains/dns-proof';
import {
  normalizeCustomDomain,
  parseReservedHostList,
} from '../lib/custom-domains/domain-policy';
import {
  addVercelDomain,
  getVercelDomain,
  removeVercelDomain,
  VercelProviderError,
  type VercelAdapterConfig,
  type VercelDomainState,
} from '../lib/custom-domains/vercel-adapter';

const ownerDomainValidator = v.object({
  id: v.id('customDomains'),
  hostname: v.string(),
  displayHostname: v.string(),
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

const resultValidator = v.object({ accepted: v.boolean() });

const configuredReservedHosts = (): string[] => {
  const hosts = parseReservedHostList(process.env.PLATFORM_HOSTS);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      hosts.push(new URL(siteUrl).hostname);
    } catch {
      throw new Error('CUSTOM_DOMAINS_NOT_CONFIGURED');
    }
  }
  return hosts;
};

const providerConfig = (): VercelAdapterConfig => ({
  token: process.env.VERCEL_API_TOKEN ?? '',
  projectId: process.env.VERCEL_PROJECT_ID ?? '',
  teamId: process.env.VERCEL_TEAM_ID || undefined,
});

const authenticate = async (ctx: ActionCtx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error('NOT_AUTHENTICATED');
  return userId;
};

type Operation = {
  domainId: Id<'customDomains'>;
  hostname: string;
  challengeName: string;
  challengeToken: string;
  proofVerified: boolean;
  revision: number;
  operationId: string;
  operationKind: 'verify' | 'refresh' | 'remove';
  desiredState: 'attached' | 'detached';
};

type OwnerDomain = {
  id: Id<'customDomains'>;
  hostname: string;
  displayHostname: string;
  status:
    | 'pending_dns'
    | 'pending_provider'
    | 'pending_verification'
    | 'active'
    | 'misconfigured'
    | 'reconciling'
    | 'removing'
    | 'remove_failed'
    | 'removed';
  desiredState: 'attached' | 'detached';
  revision: number;
  lastErrorCode?: string;
  txt?: { name: string; value: string; instructions: string };
};

const complete = async (
  ctx: Pick<ActionCtx, 'runMutation'>,
  operation: Operation,
  state: VercelDomainState
) => {
  await ctx.runMutation(internal.customDomains.completeProviderOperation, {
    domainId: operation.domainId,
    revision: operation.revision,
    operationId: operation.operationId,
    ...state,
  });
};

const fail = async (
  ctx: Pick<ActionCtx, 'runMutation'>,
  operation: Operation,
  error: unknown
) => {
  const errorCode =
    error instanceof VercelProviderError
      ? error.code
      : 'PROVIDER_UNAVAILABLE';
  await ctx.runMutation(internal.customDomains.failProviderOperation, {
    domainId: operation.domainId,
    revision: operation.revision,
    operationId: operation.operationId,
    errorCode,
  });
};

const runProviderOperation = async (
  ctx: Pick<ActionCtx, 'runMutation'>,
  operation: Operation
) => {
  try {
    if (operation.operationKind === 'remove' || operation.desiredState === 'detached') {
      const absent = await removeVercelDomain(providerConfig(), operation.hostname);
      await complete(ctx, operation, {
        exists: !absent,
        verified: false,
        configured: false,
      });
      return;
    }
    let state = await getVercelDomain(providerConfig(), operation.hostname);
    if (!state.exists) {
      state = await addVercelDomain(providerConfig(), operation.hostname);
    }
    await complete(ctx, operation, state);
  } catch (error) {
    await fail(ctx, operation, error);
  }
};

export const claim = action({
  args: { hostname: v.string() },
  returns: ownerDomainValidator,
  handler: async (ctx, args): Promise<OwnerDomain> => {
    const userId = await authenticate(ctx);
    const normalized = normalizeCustomDomain(
      args.hostname,
      configuredReservedHosts()
    );
    const challengeToken = randomBytes(32).toString('base64url');
    return await ctx.runMutation(internal.customDomains.claimForUser, {
      userId,
      hostname: normalized.hostname,
      displayHostname: normalized.displayHostname,
      challengeName: customDomainChallengeName(normalized.hostname),
      challengeToken,
    });
  },
});

export const verifyAndAttach = action({
  args: {},
  returns: resultValidator,
  handler: async (ctx) => {
    const userId = await authenticate(ctx);
    let operation: Operation;
    try {
      operation = await ctx.runMutation(internal.customDomains.beginOwnerOperation, {
        userId,
        operationId: randomUUID(),
        operationKind: 'verify',
      });
    } catch (error) {
      if (isRateLimitError(error)) throw new Error('RATE_LIMITED');
      throw error;
    }
    const expected = customDomainProofValue(operation.challengeToken);
    const records = await resolveTxt(operation.challengeName).catch(() => []);
    if (!txtRecordsContainExactProof(records, expected)) {
      await ctx.runMutation(internal.customDomains.failDnsVerification, {
        domainId: operation.domainId,
        revision: operation.revision,
        operationId: operation.operationId,
      });
      throw new Error('DNS_PROOF_NOT_FOUND');
    }
    const current = await ctx.runMutation(internal.customDomains.markProofVerified, {
      domainId: operation.domainId,
      revision: operation.revision,
      operationId: operation.operationId,
    });
    if (!current) throw new Error('STALE_OPERATION');
    await runProviderOperation(ctx, operation);
    return { accepted: true };
  },
});

const ownerProviderAction = (operationKind: 'refresh' | 'remove') =>
  action({
    args: {},
    returns: resultValidator,
    handler: async (ctx) => {
      const userId = await authenticate(ctx);
      let operation: Operation;
      try {
        operation = await ctx.runMutation(
          internal.customDomains.beginOwnerOperation,
          { userId, operationId: randomUUID(), operationKind }
        );
      } catch (error) {
        if (isRateLimitError(error)) throw new Error('RATE_LIMITED');
        throw error;
      }
      await runProviderOperation(ctx, operation);
      return { accepted: true };
    },
  });

export const refresh = ownerProviderAction('refresh');
export const remove = ownerProviderAction('remove');

export const reconcileDue = internalAction({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const ids = await ctx.runQuery(internal.customDomains.dueForReconciliation, {});
    let attempted = 0;
    for (const domainId of ids) {
      const operation: Operation | null = await ctx.runMutation(
        internal.customDomains.beginSystemReconciliation,
        { domainId, operationId: randomUUID() }
      );
      if (!operation) continue;
      await runProviderOperation(ctx, operation);
      attempted += 1;
    }
    return attempted;
  },
});
