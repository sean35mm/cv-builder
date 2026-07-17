import { parse } from 'tldts';
import { domainToUnicode } from 'node:url';

export const MAX_HOSTNAME_LENGTH = 253;
export const MAX_DISPLAY_HOSTNAME_LENGTH = 253;

const ALWAYS_RESERVED_HOSTS = ['localhost', 'vercel.app'];

export type NormalizedCustomDomain = {
  hostname: string;
  displayHostname: string;
  registrableDomain: string;
};

const canonicalReservedHost = (value: string): string | null => {
  const candidate = value
    .trim()
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/:\d{1,5}$/, '');
  if (!candidate || candidate.includes('*')) return null;
  try {
    const url = new URL(`https://${candidate}/`);
    return url.hostname === candidate && !url.port ? url.hostname : null;
  } catch {
    return null;
  }
};

const isReserved = (hostname: string, configuredHosts: readonly string[]) =>
  [...ALWAYS_RESERVED_HOSTS, ...configuredHosts]
    .map(canonicalReservedHost)
    .filter((host): host is string => Boolean(host))
    .some((host) => hostname === host || hostname.endsWith(`.${host}`));

export function normalizeCustomDomain(
  value: string,
  configuredReservedHosts: readonly string[] = []
): NormalizedCustomDomain {
  const candidate = value.trim().normalize('NFC').replace(/\.$/, '');
  if (
    !candidate ||
    candidate.length > MAX_HOSTNAME_LENGTH ||
    [...candidate].some((character) => {
      const code = character.charCodeAt(0);
      return code <= 0x20 || code === 0x7f;
    }) ||
    /[:/@\\?#%*,]/.test(candidate) ||
    candidate.includes('[') ||
    candidate.includes(']')
  ) {
    throw new Error('DOMAIN_INVALID');
  }

  let hostname: string;
  try {
    const parsedUrl = new URL(`https://${candidate}/`);
    hostname = parsedUrl.hostname.toLowerCase();
    if (
      parsedUrl.username ||
      parsedUrl.password ||
      parsedUrl.port ||
      parsedUrl.pathname !== '/' ||
      parsedUrl.search ||
      parsedUrl.hash
    ) {
      throw new Error();
    }
  } catch {
    throw new Error('DOMAIN_INVALID');
  }

  if (
    !hostname ||
    hostname.length > MAX_HOSTNAME_LENGTH ||
    hostname.includes('..') ||
    !hostname.includes('.')
  ) {
    throw new Error('DOMAIN_INVALID');
  }

  const result = parse(hostname, {
    allowIcannDomains: true,
    allowPrivateDomains: false,
    detectIp: true,
    detectSpecialUse: true,
    extractHostname: false,
    mixedInputs: false,
    validateHostname: true,
  });
  if (
    result.hostname !== hostname ||
    result.isIp ||
    result.isSpecialUse ||
    result.isIcann !== true ||
    !result.publicSuffix ||
    !result.domain ||
    result.domain === result.publicSuffix
  ) {
    throw new Error('DOMAIN_INVALID');
  }
  if (isReserved(hostname, configuredReservedHosts)) {
    throw new Error('DOMAIN_RESERVED');
  }

  let displayHostname = domainToUnicode(hostname).toLowerCase() || hostname;
  if (displayHostname.length > MAX_DISPLAY_HOSTNAME_LENGTH) {
    displayHostname = hostname;
  }

  return {
    hostname,
    displayHostname,
    registrableDomain: result.domain,
  };
}

export const parseReservedHostList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
