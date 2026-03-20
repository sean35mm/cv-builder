import { notFound } from 'next/navigation';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import type { Metadata } from 'next';
import type { Doc } from '@/convex/_generated/dataModel';
import { ProfilePublicView } from '@/components/profile-public-view';
import { toProfileContent } from '@/lib/profile-utils';
import type { SectionId } from '@/lib/types';
import { AnalyticsTracker } from '@/components/analytics-tracker';

export const revalidate = 300;

async function getProfile(username: string): Promise<Doc<'profiles'> | null> {
  return fetchQuery(api.profiles.getProfileByUsername, {
    username,
  });
}

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
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/@${profile.username}`;
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

  let viewProfile = toProfileContent(profile);
  let sectionsVisibility: Record<string, boolean> | undefined;

  if (profile.defaultVersionId) {
    try {
      const defaultVersion = await fetchQuery(
        api.versions.getDefaultVersionForProfile,
        {
          profileId: profile._id,
        }
      );

      if (defaultVersion) {
        sectionsVisibility = defaultVersion.sectionsVisibility;
        viewProfile = {
          ...viewProfile,
          sectionsOrder: defaultVersion.sectionsOrder as
            | SectionId[]
            | undefined,
        };
      }
    } catch {
      // If version fetch fails, continue with default view
    }
  }

  const themeClass = `theme-${profile.colorTheme ?? 'sage'}`;
  const pdfUrl = `/api/pdf?username=${encodeURIComponent(profile.username)}`;
  return (
    <div className={`${themeClass} bg-background text-foreground min-h-screen`}>
      <AnalyticsTracker profileId={profile._id} />
      <ProfilePublicView
        profile={viewProfile}
        pdfUrl={pdfUrl}
        sectionsVisibility={sectionsVisibility}
      />
    </div>
  );
}
