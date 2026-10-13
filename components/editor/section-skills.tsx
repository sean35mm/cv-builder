'use client';

import { TagField, type ProfileForm } from '@/components/editor/fields';

export function SectionSkills({ form }: { form: ProfileForm }) {
  return (
    <TagField
      form={form}
      name="skills"
      label="Skills"
      placeholder="Add a skill and press Enter"
      maxItems={50}
      maxLength={50}
    />
  );
}
