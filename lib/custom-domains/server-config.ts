import 'server-only';

import {
  parseAuthority,
  parseSiteOrigin,
  type HostRoutingConfig,
} from './host-routing';

export const getSiteOrigin = (): string => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured && process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_SITE_URL must be configured in production');
  }
  return parseSiteOrigin(configured ?? 'http://localhost:3000').origin;
};

export const getHostRoutingConfig = (): HostRoutingConfig => {
  const site = parseSiteOrigin(getSiteOrigin());
  const authorities = [site.host, ...(process.env.PLATFORM_HOSTS ?? '').split(',')];
  const platformAuthorities = new Set<string>();
  for (const value of authorities) {
    if (!value.trim()) continue;
    const parsed = parseAuthority(value.trim());
    if (!parsed || parsed.authority !== value.trim().toLowerCase()) {
      throw new Error('PLATFORM_HOSTS contains an invalid authority');
    }
    platformAuthorities.add(parsed.authority);
  }
  return {
    enabled: process.env.CUSTOM_DOMAINS_ENABLED === 'true',
    platformAuthorities,
  };
};
