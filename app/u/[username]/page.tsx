import { notFound } from 'next/navigation';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import type { Metadata } from 'next';
import type { Doc } from '@/convex/_generated/dataModel';
import { ProfilePublicView } from '@/components/profile-public-view';
import { toProfileContent } from '@/lib/profile-utils';
import { Download } from 'lucide-react';

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
  const viewProfile = toProfileContent(profile);
  const themeClass = `theme-${profile.colorTheme ?? 'sage'}`;
  const pdfUrl = `/api/pdf?username=${encodeURIComponent(profile.username)}`;
  return (
    <div className={`${themeClass} bg-background text-foreground min-h-screen`}>
      <ProfilePublicView profile={viewProfile} pdfUrl={pdfUrl} />
    </div>
  );
}
