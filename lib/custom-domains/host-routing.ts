export type ParsedAuthority = { authority: string; hostname: string };

export type HostRoutingConfig = {
  enabled: boolean;
  platformAuthorities: ReadonlySet<string>;
};

export type HostClassification =
  | { kind: 'platform'; hostname: string }
  | { kind: 'custom'; hostname: string }
  | { kind: 'invalid' };

export const parseSiteOrigin = (value: string): URL => {
  const url = new URL(value);
  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username ||
    url.password ||
    url.hostname.includes('*') ||
    (url.pathname !== '/' && url.pathname !== '') ||
    url.search ||
    url.hash
  ) {
    throw new Error('NEXT_PUBLIC_SITE_URL must be a credential-free origin');
  }
  return url;
};

export const parseAuthority = (value: string | null): ParsedAuthority | null => {
  if (!value || value !== value.trim() || /[\s,@/\\?#]/.test(value)) return null;
  const match = value.match(/^([A-Za-z0-9.-]+)(?::([0-9]{1,5}))?$/);
  if (!match) return null;
  const hostname = match[1].toLowerCase().replace(/\.$/, '');
  const port = match[2];
  if (
    !hostname ||
    hostname.includes('..') ||
    (port !== undefined && (Number(port) < 1 || Number(port) > 65535))
  ) {
    return null;
  }
  return { authority: `${hostname}${port ? `:${Number(port)}` : ''}`, hostname };
};

export function classifyRequestHost(
  hostHeader: string | null,
  config: HostRoutingConfig
): HostClassification {
  const parsed = parseAuthority(hostHeader);
  if (!parsed) return { kind: 'invalid' };
  if (config.platformAuthorities.has(parsed.authority)) {
    return { kind: 'platform', hostname: parsed.hostname };
  }
  if (!config.enabled || parsed.authority !== parsed.hostname) {
    return { kind: 'invalid' };
  }
  return { kind: 'custom', hostname: parsed.hostname };
}

export const isAllowedCustomHostPath = (pathname: string): boolean =>
  pathname === '/' ||
  /^\/[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(pathname) ||
  pathname.startsWith('/_next/') ||
    pathname === '/api/pdf' ||
    pathname.startsWith('/api/export') ||
    pathname.startsWith('/api/analytics/event') ||
    pathname.startsWith('/embed/') ||
  pathname.startsWith('/api/profile-share/') ||
  pathname.startsWith('/api/storage/') ||
  [
    '/api/profile-access/unlock',
    '/api/profile-access/lock',
    '/api/profile-access/event',
    '/api/profile-access/contact',
  ].includes(pathname);

export const hasSingleHostHeaderValue = (headers: Headers): boolean => {
  const host = headers.get('host');
  return Boolean(host && !host.includes(','));
};
