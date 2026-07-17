import { fetchQuery } from 'convex/nextjs';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { AnalyticsTracker } from '@/components/analytics-tracker';
import { ProfilePasscodeForm } from '@/components/profile-passcode-form';
import { ProfilePublicView } from '@/components/profile-public-view';
import { api } from '@/convex/_generated/api';
import {
  customDomainCanonicalUrl,
  customDomainRobots,
} from '@/lib/custom-domains/access-metadata';
import { classifyRequestHost } from '@/lib/custom-domains/host-routing';
import {
  getHostRoutingConfig,
  getSiteOrigin,
} from '@/lib/custom-domains/server-config';
import {
  grantTokenForUsername,
  PROFILE_GRANT_COOKIE,
  profileAccessService,
  type AuthorizedProfileBundle,
  type ProfileAccessEnvelope,
} from '@/lib/profile/passcode-server';
import { toProfileContent } from '@/lib/profile-utils';
import { resolveTemplateId } from '@/lib/templates';
import { profileShareAssetUrl } from '@/lib/profile/share-assets';
import {
  createProfileJsonLd,
  serializeJsonLd,
} from '@/lib/profile/structured-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const resolveDomain = async () => {
  noStore();
  const requestHeaders = await headers();
  const classification = classifyRequestHost(
    requestHeaders.get('host'),
    getHostRoutingConfig()
  );
  if (classification.kind !== 'custom') return null;
  return await fetchQuery(api.customDomains.resolveHost, {
    hostname: classification.hostname,
  }).catch(() => null);
};

const getPublicProfile = (username: string, locale?: string) =>
  locale
    ? fetchQuery(api.profileLocales.getByUsername, { username, locale }).catch(
        () => null
      )
    : fetchQuery(api.profiles.getProfileByUsername, { username }).catch(() => null);

const localizedDomainUrl = (hostname: string, locale?: string): string => {
  const base = customDomainCanonicalUrl(hostname);
  return locale ? `${base.replace(/\/$/, '')}/${encodeURIComponent(locale)}` : base;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale } = await searchParams;
  const domain = await resolveDomain();
  if (!domain) return { title: 'Profile Not Found', robots: customDomainRobots('private') };
  const profile = await getPublicProfile(domain.username, locale);
  if (!profile || profile._id !== domain.profileId) {
    const envelope = await profileAccessService<ProfileAccessEnvelope>('envelope', {
      username: domain.username,
    }).catch(() => null);
    if (envelope?.ok && envelope.data?.profileId === domain.profileId) {
      const url = customDomainCanonicalUrl(domain.hostname);
      const image = profileShareAssetUrl(url, domain.username, 'og');
      return {
        title: 'Protected profile',
        description: 'This profile requires a passcode.',
        alternates: { canonical: url },
        openGraph: { url, title: 'Protected profile', images: [image] },
        twitter: { card: 'summary_large_image', images: [image] },
        robots: customDomainRobots('passcode'),
      };
    }
    return { title: 'Profile Not Found', robots: customDomainRobots('private') };
  }
  const title = `${profile.name} - CV`;
  const description =
    profile.bio || `${profile.name}'s professional CV and portfolio`;
  const baseUrl = customDomainCanonicalUrl(domain.hostname);
  const url = localizedDomainUrl(domain.hostname, locale);
  const image = profileShareAssetUrl(url, profile.username, 'og');
  const languages = Object.fromEntries(
    (profile.locales ?? [profile.defaultLocale ?? 'en']).map((item: string) => [
      item,
      item === profile.defaultLocale
        ? baseUrl
        : localizedDomainUrl(domain.hostname, item),
    ])
  );
  return {
    title,
    description,
    alternates: { canonical: url, languages },
    openGraph: { type: 'profile', url, title, description, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    robots: customDomainRobots(profile.accessMode),
  };
}

type PublicProfile = NonNullable<Awaited<ReturnType<typeof getPublicProfile>>>;
type PublicTestimonial = {
  _id: string;
  authorName: string;
  authorTitle?: string;
  authorCompany?: string;
  relationship: string;
  content: string;
  rating?: number;
  createdAt: number;
};

export default async function CustomDomainPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  const { locale } = await searchParams;
  const domain = await resolveDomain();
  if (!domain) notFound();
  let profile = await getPublicProfile(domain.username, locale);
  if (profile && profile._id !== domain.profileId) notFound();
  let testimonials: PublicTestimonial[] = [];
  let protectedProfile = false;

  if (profile) {
    testimonials = await fetchQuery(api.testimonials.getPublicTestimonials, {
      profileId: profile._id,
    }).catch(() => []);
  } else {
    const envelopeResponse = await profileAccessService<ProfileAccessEnvelope>(
      'envelope',
      { username: domain.username }
    ).catch(() => null);
    const envelope = envelopeResponse?.ok ? envelopeResponse.data : null;
    if (
      !envelope ||
      envelope.mode !== 'passcode' ||
      envelope.profileId !== domain.profileId
    ) {
      notFound();
    }
    const cookieStore = await cookies();
    const token = grantTokenForUsername(
      cookieStore.get(PROFILE_GRANT_COOKIE)?.value,
      envelope.username
    );
    const response = await profileAccessService<
      AuthorizedProfileBundle<PublicProfile, PublicTestimonial>
    >('bundle', {
      username: envelope.username,
      ...(token ? { token } : {}),
      ...(locale ? { locale } : {}),
    }).catch(() => null);
    if (!response?.ok || !response.data) {
      return <ProfilePasscodeForm username={envelope.username} />;
    }
    profile = response.data.profile;
    testimonials = response.data.testimonials;
    protectedProfile = true;
  }

  if (!profile || profile._id !== domain.profileId) notFound();
  const viewProfile = toProfileContent(profile);
  const themeClass = `theme-${profile.colorTheme ?? 'sage'}`;
  const pdfUrl = `/api/pdf?username=${encodeURIComponent(profile.username)}${locale ? `&locale=${encodeURIComponent(locale)}` : ''}`;
  const canonicalUrl = localizedDomainUrl(domain.hostname, locale);
  const jsonLd = protectedProfile
    ? null
    : serializeJsonLd(createProfileJsonLd(viewProfile, canonicalUrl));

  return (
    <div className={`profile-theme ${themeClass} min-h-screen bg-background text-foreground`} data-profile-theme={profile.colorTheme ?? 'sage'}>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      <AnalyticsTracker
        profileId={profile._id}
        username={profile.username}
        protectedProfile={protectedProfile}
        hostBound
        analyticsEnabled={profile.analyticsEnabled !== false}
      />
      <ProfilePublicView
        profile={viewProfile}
        pdfUrl={pdfUrl}
        sectionsVisibility={profile.sectionsVisibility}
        profileId={profile._id}
        templateId={resolveTemplateId(profile.templateId)}
        testimonials={testimonials}
        headingFont={profile.headingFont}
        bodyFont={profile.bodyFont}
        protectedProfile={protectedProfile}
        hostBound
        platformOrigin={getSiteOrigin()}
        canonicalUrl={canonicalUrl}
      />
    </div>
  );
}
