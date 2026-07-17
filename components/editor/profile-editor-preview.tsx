'use client';

import { useWatch, type UseFormReturn } from 'react-hook-form';

import { ProfilePreview } from '@/components/profile-preview';
import type { SectionsVisibility } from '@/lib/profile/domain';
import {
  toPreviewProfile,
  type PersistedProfileInput,
  type ProfileUpdateFormValues,
} from '@/lib/profile/editor';

export function ProfileEditorPreview({
  form,
  profile,
  sectionsVisibility,
}: {
  form: UseFormReturn<ProfileUpdateFormValues>;
  profile: PersistedProfileInput;
  sectionsVisibility: SectionsVisibility;
}) {
  const values = useWatch({
    control: form.control,
  }) as ProfileUpdateFormValues;
  const previewProfile = toPreviewProfile(profile, values);

  return (
    <ProfilePreview
      profile={previewProfile}
      sectionsOrder={values.sectionsOrder}
      sectionsVisibility={sectionsVisibility}
      headingFont={profile.headingFont}
      bodyFont={profile.bodyFont}
      colorTheme={
        (profile as PersistedProfileInput & { colorTheme?: string }).colorTheme
      }
    />
  );
}
