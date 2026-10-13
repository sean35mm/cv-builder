'use client';

import { TagField, type ProfileForm } from '@/components/editor/fields';

export function SectionInterests({ form }: { form: ProfileForm }) {
  return (
    <TagField
      form={form}
      name="interests"
      label="Interests"
      placeholder="Add an interest and press Enter"
      maxItems={50}
      maxLength={100}
    />
  );
}
