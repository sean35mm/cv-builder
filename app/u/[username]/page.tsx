import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { cache } from 'react';
import { AnalyticsTracker } from '@/components/analytics-tracker';
import { ProfilePasscodeForm } from '@/components/profile-passcode-form';
import { ProfilePublicView } from '@/components/profile-public-view';
import { api } from '@/convex/_generated/api';
import {
  getProfileRobotsPolicy,
} from '@/lib/profile/access';
import {
  grantTokenForUsername,
  PROFILE_GRANT_COOKIE,
  profileAccessService,
  type AuthorizedProfileBundle,
  type ProfileAccessEnvelope,
} from '@/lib/profile/passcode-server';
import { toProfileContent } from '@/lib/profile-utils';
import { resolveTemplateId } from '@/lib/templates';
import { profileCanonicalUrl } from '@/lib/custom-domains/access-metadata';
import { getSiteOrigin } from '@/lib/custom-domains/server-config';
import { profileShareAssetUrl } from '@/lib/profile/share-assets';
import {
  createProfileJsonLd,
  serializeJsonLd,
} from '@/lib/profile/structured-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const validUsername = (username: string): boolean =>
  Boolean(username && username.length <= 100 && !/[/?#%\\]/.test(username));

const getPublicProfile = cache(async (username: string, locale?: string) => {
  if (!validUsername(username)) return null;
  return locale
    ? fetchQuery(api.profileLocales.getByUsername, { username, locale }).catch(
        () => null
      )
    : fetchQuery(api.profiles.getProfileByUsername, { username }).catch(
        () => null
      );
});

const getAccessEnvelope = cache(async (username: string) => {
  if (!validUsername(username)) return null;
  const response = await profileAccessService<ProfileAccessEnvelope>(
    'envelope',
    { username }
  ).catch(() => null);
  return response?.ok ? response.data : null;
});

const getCanonicalUrl = cache(async (username: string) => {
  const activeDomain = await fetchQuery(
    api.customDomains.resolveActiveForUsername,
    { username }
  ).catch(() => null);
  return profileCanonicalUrl(getSiteOrigin(), username, activeDomain?.hostname);
});

const localizedUrl = (baseUrl: string, locale?: string): string => {
  if (!locale) return baseUrl;
  const url = new URL(baseUrl);
  url.pathname = `${url.pathname.replace(/\/$/, '')}/${encodeURIComponent(locale)}`;
  return url.toString();
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; locale?: string }>;
}): Promise<Metadata> {
  noStore();
  const { username, locale } = await params;
  const profile = await getPublicProfile(username, locale);
  if (!profile) {
    const envelope = await getAccessEnvelope(username);
    if (envelope?.mode === 'passcode') {
      const url = await getCanonicalUrl(envelope.username);
      const image = profileShareAssetUrl(url, envelope.username, 'og');
      return {
        title: 'Protected profile',
        description: 'This profile requires a passcode.',
        alternates: { canonical: url },
        openGraph: {
          type: 'website',
          url,
          title: 'Protected profile',
          description: 'This profile requires a passcode.',
          images: [image],
        },
        twitter: { card: 'summary_large_image', images: [image] },
        robots: getProfileRobotsPolicy('passcode'),
      };
    }
    return { title: 'Profile Not Found', robots: getProfileRobotsPolicy('private') };
  }
  const title = `${profile.name} - CV`;
  const description =
    profile.bio || `${profile.name}'s professional CV and portfolio`;
  const baseUrl = await getCanonicalUrl(profile.username);
  const url = localizedUrl(baseUrl, locale);
  const image = profileShareAssetUrl(url, profile.username, 'og');
  const languages = Object.fromEntries(
    (profile.locales ?? [profile.defaultLocale ?? 'en']).map((item: string) => [
      item,
      item === profile.defaultLocale
        ? baseUrl
        : localizedUrl(baseUrl, item),
    ])
  );
  return {
    title,
    description,
    alternates: { canonical: url, languages },
    openGraph: { type: 'profile', url, title, description, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    robots: getProfileRobotsPolicy(profile.accessMode),
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

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string; locale?: string }>;
}) {
  noStore();
  const { username, locale } = await params;
  let profile: PublicProfile | null = await getPublicProfile(username, locale);
  let testimonials: PublicTestimonial[] = [];
  let protectedProfile = false;

  if (profile) {
    testimonials = await fetchQuery(api.testimonials.getPublicTestimonials, {
      profileId: profile._id,
    }).catch(() => []);
  } else {
    const envelope = await getAccessEnvelope(username);
    if (!envelope || envelope.mode !== 'passcode') notFound();
    const cookieStore = await cookies();
    const token = grantTokenForUsername(
      cookieStore.get(PROFILE_GRANT_COOKIE)?.value,
      envelope.username
    );
    const authToken = await convexAuthNextjsToken();
    const ownerProfile = authToken
      ? await fetchQuery(api.profiles.getMyProfile, {}, { token: authToken }).catch(
          () => null
        )
      : null;
    const ownerProfileId =
      ownerProfile?._id === envelope.profileId ? ownerProfile._id : undefined;
    const response = await profileAccessService<
      AuthorizedProfileBundle<PublicProfile, PublicTestimonial>
    >('bundle', {
      username: envelope.username,
      ...(token ? { token } : {}),
      ...(ownerProfileId ? { ownerProfileId } : {}),
      ...(locale ? { locale } : {}),
    }).catch(() => null);
    if (!response?.ok || !response.data) {
      return <ProfilePasscodeForm username={envelope.username} />;
    }
    profile = response.data.profile;
    testimonials = response.data.testimonials;
    protectedProfile = true;
  }

  if (!profile) notFound();
  const viewProfile = toProfileContent(profile);
  const themeClass = `theme-${profile.colorTheme ?? 'sage'}`;
  const pdfUrl = `/api/pdf?username=${encodeURIComponent(profile.username)}${locale ? `&locale=${encodeURIComponent(locale)}` : ''}`;
  const templateId = resolveTemplateId(profile.templateId);
  const canonicalUrl = localizedUrl(
    await getCanonicalUrl(profile.username),
    locale
  );
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
        analyticsEnabled={profile.analyticsEnabled !== false}
      />
      <ProfilePublicView
        profile={viewProfile}
        pdfUrl={pdfUrl}
        sectionsVisibility={profile.sectionsVisibility}
        profileId={profile._id}
        templateId={templateId}
        testimonials={testimonials}
        headingFont={profile.headingFont}
        bodyFont={profile.bodyFont}
        protectedProfile={protectedProfile}
        canonicalUrl={canonicalUrl}
      />
    </div>
  );
}
