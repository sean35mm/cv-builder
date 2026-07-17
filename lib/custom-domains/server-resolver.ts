import 'server-only';

import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { classifyRequestHost } from './host-routing';
import { getHostRoutingConfig } from './server-config';

export type ActiveCustomDomainBinding = {
  hostname: string;
  profileId: string;
  username: string;
};

export type RequestHostBinding =
  | { kind: 'platform' }
  | ({ kind: 'custom' } & ActiveCustomDomainBinding)
  | { kind: 'denied' };

export async function resolveRequestHostBinding(
  request: Request
): Promise<RequestHostBinding> {
  const classification = classifyRequestHost(
    request.headers.get('host'),
    getHostRoutingConfig()
  );
  if (classification.kind === 'platform') return { kind: 'platform' };
  if (classification.kind !== 'custom') return { kind: 'denied' };
  const domain = await fetchQuery(api.customDomains.resolveHost, {
    hostname: classification.hostname,
  }).catch(() => null);
  if (!domain || domain.hostname !== classification.hostname) return { kind: 'denied' };
  return { kind: 'custom', ...domain };
}
