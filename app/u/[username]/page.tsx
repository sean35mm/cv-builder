import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import { ProfilePublicView } from "@/components/profile-public-view";

export const dynamic = "force-dynamic";

async function getProfile(username: string) {
  const profile = await fetchQuery(api.profiles.getProfileByUsername, {
    username,
  });
  return profile;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: "Profile Not Found" };
  const title = `${profile.name} - CV`;
  const description =
    profile.bio || `${profile.name}'s professional CV and portfolio`;
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/@${profile.username}`;
  return {
    title,
    description,
    alternates: { canonical: url || undefined },
    openGraph: {
      type: "profile",
      url,
      title,
      description,
    },
    twitter: {
      card: "summary",
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
  return <ProfilePublicView profile={profile as any} />;
}
