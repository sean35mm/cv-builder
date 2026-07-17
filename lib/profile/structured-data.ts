import type { ProfileContent } from './domain';
import { normalizeExternalUrl } from '@/lib/profile-format';

const socialUrl = (value: string | undefined, base: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return normalizeExternalUrl(
    /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `${base}${trimmed.replace(/^@/, '')}`
  );
};

export function createProfileJsonLd(
  profile: ProfileContent,
  canonicalUrl: string
): Record<string, unknown> {
  const sameAs = Array.from(
    new Set(
      [
        normalizeExternalUrl(profile.website),
        socialUrl(profile.github, 'https://github.com/'),
        socialUrl(profile.linkedin, 'https://www.linkedin.com/in/'),
        socialUrl(profile.twitter, 'https://x.com/'),
      ].filter((url): url is string => Boolean(url))
    )
  );
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: canonicalUrl,
    ...(profile.title ? { jobTitle: profile.title } : {}),
    ...(profile.bio ? { description: profile.bio } : {}),
    ...(profile.location
      ? { homeLocation: { '@type': 'Place', name: profile.location } }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export const serializeJsonLd = (value: Record<string, unknown>): string =>
  JSON.stringify(value).replace(/</g, '\\u003c');
