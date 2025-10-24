import { notFound } from 'next/navigation';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import type { Metadata } from 'next';
import type { Doc } from '@/convex/_generated/dataModel';
import { ProfilePublicView } from '@/components/profile-public-view';
import { SECTION_IDS, type ProfileContent, type SectionId } from '@/lib/types';

export const revalidate = 300;

async function getProfile(username: string): Promise<Doc<'profiles'> | null> {
  return fetchQuery(api.profiles.getProfileByUsername, {
    username,
  });
}

const isSectionId = (value: string): value is SectionId =>
  SECTION_IDS.includes(value as SectionId);

function toProfileContent(profile: Doc<'profiles'>): ProfileContent {
  const sectionsOrder =
    profile.sectionsOrder?.filter((section): section is SectionId =>
      isSectionId(section)
    ) ?? undefined;

  return {
    name: profile.name,
    title: profile.title ?? undefined,
    location: profile.location ?? undefined,
    bio: profile.bio ?? undefined,
    email: profile.email ?? undefined,
    website: profile.website ?? undefined,
    github: profile.github ?? undefined,
    linkedin: profile.linkedin ?? undefined,
    twitter: profile.twitter ?? undefined,
    experience: profile.experience,
    education: profile.education,
    skills: profile.skills,
    projects: profile.projects ?? [],
    certifications: profile.certifications ?? [],
    volunteering: profile.volunteering ?? [],
    exhibitions: profile.exhibitions ?? [],
    awards: profile.awards ?? [],
    sectionsOrder,
  };
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
  return (
    <div className={themeClass}>
      <ProfilePublicView profile={viewProfile} />
    </div>
  );
}
