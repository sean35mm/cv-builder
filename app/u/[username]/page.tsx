import { notFound } from 'next/navigation';
import { fetchQuery } from 'convex/nextjs';
import { cache } from 'react';
import { api } from '@/convex/_generated/api';
import type { Metadata } from 'next';
import { ProfilePublicView } from '@/components/profile-public-view';
import { toProfileContent } from '@/lib/profile-utils';
import { AnalyticsTracker } from '@/components/analytics-tracker';
import { resolveTemplateId } from '@/lib/templates';

const getProfile = cache(async (username: string) => {
  if (!username || username.length > 100 || /[/?#%\\]/.test(username)) {
    return null;
  }
  return fetchQuery(api.profiles.getProfileByUsername, {
    username,
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: 'Profile Not Found' };
  const title = `${profile.name} - CV`;
  const description =
    profile.bio || `${profile.name}'s professional CV and portfolio`;
  const url = `/@${profile.username}`;
  return {
    title,
    description,
    alternates: { canonical: url || undefined },
    openGraph: {
      type: 'profile',
      url,
      title,
      description,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const viewProfile = toProfileContent(profile);

  const themeClass = `theme-${profile.colorTheme ?? 'sage'}`;
  const pdfUrl = `/api/pdf?username=${encodeURIComponent(profile.username)}`;
  const templateId = resolveTemplateId(profile.templateId);

  const testimonials = await fetchQuery(
    api.testimonials.getPublicTestimonials,
    { profileId: profile._id }
  ).catch(() => []);

  return (
    <div className={`${themeClass} bg-background text-foreground min-h-screen`}>
      <AnalyticsTracker profileId={profile._id} />
      <ProfilePublicView
        profile={viewProfile}
        pdfUrl={pdfUrl}
        sectionsVisibility={profile.sectionsVisibility}
        profileId={profile._id}
        templateId={templateId}
        testimonials={testimonials}
        headingFont={profile.headingFont}
        bodyFont={profile.bodyFont}
      />
    </div>
  );
}
