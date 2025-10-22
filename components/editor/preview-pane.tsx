'use client';

import { ProfilePreview } from '@/components/profile-preview';
import type {
  EducationEntry,
  ExperienceEntry,
  ProfileContent,
  SectionId,
} from '@/lib/types';

export function PreviewPane({
  profile,
  sectionsOrder,
  onReorderExperience,
  onReorderEducation,
  onReorderSkills,
}: {
  profile: ProfileContent;
  sectionsOrder?: Array<SectionId>;
  onReorderExperience: (next: ExperienceEntry[]) => void;
  onReorderEducation: (next: EducationEntry[]) => void;
  onReorderSkills: (next: string[]) => void;
}) {
  return (
    <ProfilePreview
      profile={profile}
      sectionsOrder={sectionsOrder}
      onReorderSections={undefined}
      onReorderExperience={onReorderExperience}
      onReorderEducation={onReorderEducation}
      onReorderSkills={onReorderSkills}
      showDragHandles={false}
    />
  );
}
