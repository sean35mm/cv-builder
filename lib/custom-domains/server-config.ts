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
const PRODUCTION_SITE_ORIGIN = 'https://www.opencv.app';

export const resolveSiteOrigin = (
  configured: string | undefined,
  nodeEnv: string | undefined
): string => {
  if (nodeEnv !== 'production') {
    return parseSiteOrigin(configured ?? 'http://localhost:3000').origin;
  }

  if (!configured) return PRODUCTION_SITE_ORIGIN;

  try {
    const candidate = parseSiteOrigin(configured);
    if (
      candidate.protocol === 'https:' &&
      APPLICATION_PLATFORM_AUTHORITIES.has(candidate.host.toLowerCase())
    ) {
      return candidate.origin;
    }
  } catch {
    // Invalid public configuration must not prevent production metadata rendering.
  }

  return PRODUCTION_SITE_ORIGIN;
};

export const getSiteOrigin = (): string =>
  resolveSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL, process.env.NODE_ENV);

export const getHostRoutingConfig = (): HostRoutingConfig => {
  const configuredSite = process.env.NEXT_PUBLIC_SITE_URL
    ? parseSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL)
    : parseSiteOrigin(getSiteOrigin());
  const authorities = [
    configuredSite.host,
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
