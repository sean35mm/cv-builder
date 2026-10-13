'use client';

import { useWatch } from 'react-hook-form';

import { EntryList } from '@/components/editor/entry-list';
import {
  CheckboxField,
  FieldGrid,
  MonthField,
  TextField,
  type ProfileForm,
} from '@/components/editor/fields';
import type { ProfileFieldArrayController } from '@/components/editor/hooks/use-profile-field-arrays';
import type { ExperienceEntry } from '@/lib/profile/domain';

export const summarizeRole = (role: string, place: string) =>
  [role.trim(), place.trim()].filter(Boolean).join(' · ');

function ExperienceFields({
  form,
  index,
}: {
  form: ProfileForm;
  index: number;
}) {
  const current = useWatch({
    control: form.control,
    name: `experience.${index}.current`,
  });
  return (
    <>
      <FieldGrid>
        <TextField
          form={form}
          name={`experience.${index}.role`}
          label="Role"
          maxLength={120}
        />
        <TextField
          form={form}
          name={`experience.${index}.company`}
          label="Company"
          maxLength={120}
        />
        <MonthField
          form={form}
          name={`experience.${index}.startDate`}
          label="Start"
        />
        <MonthField
          form={form}
          name={`experience.${index}.endDate`}
          label="End"
          disabled={current}
        />
      </FieldGrid>
      <CheckboxField
        form={form}
        name={`experience.${index}.current`}
        label="I currently work here"
        onCheckedChange={(checked) => {
          if (checked) {
            form.setValue(`experience.${index}.endDate`, '', {
              shouldValidate: true,
            });
          }
        }}
      />
      <TextField
        form={form}
        name={`experience.${index}.description`}
        label="Description"
        multiline
        maxLength={1000}
        counter
      />
    </>
  );
}

export function SectionExperience({
  form,
  controller,
}: {
  form: ProfileForm;
  controller: ProfileFieldArrayController<ExperienceEntry>;
}) {
  return (
    <EntryList
      form={form}
      name="experience"
      noun="role"
      controller={controller}
      summarize={(entry) => summarizeRole(entry.role, entry.company)}
    >
      {(index) => <ExperienceFields form={form} index={index} />}
    </EntryList>
  );
}
