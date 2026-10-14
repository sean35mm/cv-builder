import type { ProfileContent } from './domain';
import { normalizeExternalUrl } from '@/lib/profile-format';

const socialUrl = (
  value: string | undefined,
  base: string
): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return normalizeExternalUrl(
    /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `${base}${trimmed.replace(/^@/, '')}`
  );
};

// Google reads profile pages as a ProfilePage whose mainEntity is the person.
// Only public fields go in; contact details like email stay out.
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
  const employers = Array.from(
    new Set(
      profile.experience
        .filter((entry) => entry.current && entry.company.trim())
        .map((entry) => entry.company.trim())
    )
  );
  const schools = Array.from(
    new Set(
      profile.education.map((entry) => entry.school.trim()).filter(Boolean)
    )
  );
  const languages = profile.languages
    .map((entry) => entry.name.trim())
    .filter(Boolean);
  const person = {
    '@type': 'Person',
    name: profile.name,
    url: canonicalUrl,
    ...(profile.title ? { jobTitle: profile.title } : {}),
    ...(profile.bio ? { description: profile.bio } : {}),
    ...(profile.location
      ? { homeLocation: { '@type': 'Place', name: profile.location } }
      : {}),
    ...(employers.length
      ? {
          worksFor: employers.map((name) => ({
            '@type': 'Organization',
            name,
          })),
        }
      : {}),
    ...(schools.length
      ? {
          alumniOf: schools.map((name) => ({
            '@type': 'EducationalOrganization',
            name,
          })),
        }
      : {}),
    ...(profile.skills.length ? { knowsAbout: profile.skills } : {}),
    ...(languages.length ? { knowsLanguage: languages } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: canonicalUrl,
    mainEntity: person,
  };
}

// "Noor Haddad, Staff software engineer". Callers add the site name.
type ProfileSummary = Pick<
  ProfileContent,
  'name' | 'title' | 'bio' | 'location'
>;

export const profilePageTitle = (profile: ProfileSummary): string =>
  profile.title?.trim()
    ? `${profile.name}, ${profile.title.trim()}`
    : profile.name;

export function profileMetaDescription(profile: ProfileSummary): string {
  if (profile.bio?.trim()) return profile.bio.trim();
  const summary = [profile.title, profile.location]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(', ');
  return summary
    ? `${profile.name}: ${summary}. CV and portfolio on OpenCV.`
    : `${profile.name}'s CV and portfolio on OpenCV.`;
}

// The same JSON export the editor offers, linked from public profiles so
// agents can read a CV without scraping the page.
export const profileJsonExportPath = (username: string): string =>
  `/api/export?username=${encodeURIComponent(username)}&format=json`;

export const serializeJsonLd = (value: Record<string, unknown>): string =>
  JSON.stringify(value).replace(/</g, '\\u003c');
