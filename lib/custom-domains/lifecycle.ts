export const CUSTOM_DOMAIN_STATUSES = [
  'pending_dns',
  'pending_provider',
  'pending_verification',
  'active',
  'misconfigured',
  'reconciling',
  'removing',
  'remove_failed',
  'removed',
] as const;

export type CustomDomainStatus = (typeof CUSTOM_DOMAIN_STATUSES)[number];
export type CustomDomainDesiredState = 'attached' | 'detached';
export type CustomDomainOperationKind = 'verify' | 'refresh' | 'remove';

const transitions: Record<CustomDomainStatus, readonly CustomDomainStatus[]> = {
  pending_dns: ['pending_provider', 'removing'],
  pending_provider: ['pending_verification', 'active', 'misconfigured', 'reconciling', 'removing'],
  pending_verification: ['active', 'misconfigured', 'reconciling', 'removing'],
  active: ['misconfigured', 'reconciling', 'removing'],
  misconfigured: ['active', 'pending_verification', 'reconciling', 'removing'],
  reconciling: ['active', 'pending_verification', 'misconfigured', 'removing', 'remove_failed'],
  removing: ['removed', 'remove_failed', 'reconciling'],
  remove_failed: ['removing', 'removed', 'reconciling'],
  removed: ['pending_dns'],
};

export const canTransitionCustomDomain = (
  from: CustomDomainStatus,
  to: CustomDomainStatus
): boolean => from === to || transitions[from].includes(to);

export const operationIsCurrent = (
  current: { revision: number; operationId?: string },
  completion: { revision: number; operationId: string }
): boolean =>
  current.revision === completion.revision &&
  current.operationId === completion.operationId;

export const customDomainRoutesPublicly = (domain: {
  status: CustomDomainStatus;
  desiredState: CustomDomainDesiredState;
}): boolean => domain.status === 'active' && domain.desiredState === 'attached';

export const nextCustomDomainRetryAt = (
  now: number,
  attemptCount: number
): number => now + Math.min(6 * 60 * 60 * 1000, 30_000 * 2 ** Math.min(attemptCount, 9));

export const accountDeletionCustomDomainPolicy = (
  domain: { status: CustomDomainStatus } | null
): 'advance' | 'delete' | 'remove' => {
  if (!domain) return 'advance';
  return domain.status === 'removed' ? 'delete' : 'remove';
};

export const deletionCanAdvancePastCustomDomain = (
  domain: { status: CustomDomainStatus } | null
): boolean => accountDeletionCustomDomainPolicy(domain) !== 'remove';
