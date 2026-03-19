import type { Doc } from '@/convex/_generated/dataModel';
import { SECTION_IDS, type ProfileContent, type SectionId } from '@/lib/types';

const isSectionId = (value: string): value is SectionId =>
  SECTION_IDS.includes(value as SectionId);

export function toProfileContent(profile: Doc<'profiles'>): ProfileContent {
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
