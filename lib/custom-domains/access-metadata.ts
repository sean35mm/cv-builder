export const customDomainCanonicalUrl = (hostname: string): string =>
  `https://${hostname}/`;

export const profileCanonicalUrl = (
  platformOrigin: string,
  username: string,
  activeCustomHostname?: string | null
): string =>
  activeCustomHostname
    ? customDomainCanonicalUrl(activeCustomHostname)
    : `${platformOrigin}/@${encodeURIComponent(username)}`;

export const customDomainRobots = (accessMode: string) =>
  accessMode === 'public'
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true };
