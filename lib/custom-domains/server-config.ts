import 'server-only';

import {
  parseAuthority,
  parseSiteOrigin,
  type HostRoutingConfig,
} from './host-routing';

const APPLICATION_PLATFORM_AUTHORITIES = new Set([
  'opencv.app',
  'www.opencv.app',
]);

export const getSiteOrigin = (): string => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured && process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_SITE_URL must be configured in production');
  }
  return parseSiteOrigin(configured ?? 'http://localhost:3000').origin;
};

export const getHostRoutingConfig = (): HostRoutingConfig => {
  const site = parseSiteOrigin(getSiteOrigin());
  const authorities = [
    site.host,
    ...(process.env.PLATFORM_HOSTS ?? '').split(','),
  ];
  const platformAuthorities = new Set<string>(APPLICATION_PLATFORM_AUTHORITIES);
  for (const [index, value] of authorities.entries()) {
    if (!value.trim()) continue;
    const parsed = parseAuthority(value.trim());
    if (!parsed) {
      throw new Error('PLATFORM_HOSTS contains an invalid authority');
    }
    platformAuthorities.add(parsed.authority);
    if (index === 0 && parsed.hostname.includes('.')) {
      const aliasHostname = parsed.hostname.startsWith('www.')
        ? parsed.hostname.slice(4)
        : `www.${parsed.hostname}`;
      const port = parsed.authority.slice(parsed.hostname.length);
      platformAuthorities.add(`${aliasHostname}${port}`);
    }
  }
  return {
    enabled: process.env.CUSTOM_DOMAINS_ENABLED === 'true',
    platformAuthorities,
  };
};
