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
import { summarizeRole } from '@/components/editor/section-experience';
import type { EducationEntry } from '@/lib/profile/domain';

function EducationFields({
  form,
  index,
}: {
  form: ProfileForm;
  index: number;
}) {
  const current = useWatch({
    control: form.control,
    name: `education.${index}.current`,
  });
  return (
    <>
      <FieldGrid>
        <TextField
          form={form}
          name={`education.${index}.school`}
          label="School"
          maxLength={120}
        />
        <TextField
          form={form}
          name={`education.${index}.degree`}
          label="Degree"
          maxLength={120}
        />
        <MonthField
          form={form}
          name={`education.${index}.startDate`}
          label="Start"
        />
        <MonthField
          form={form}
          name={`education.${index}.endDate`}
          label="End"
          disabled={current}
        />
      </FieldGrid>
      <CheckboxField
        form={form}
        name={`education.${index}.current`}
        label="I currently study here"
        onCheckedChange={(checked) => {
          if (checked) {
            form.setValue(`education.${index}.endDate`, '', {
              shouldValidate: true,
            });
          }
        }}
      />
      <TextField
        form={form}
        name={`education.${index}.description`}
        label="Description"
        multiline
        maxLength={1000}
        counter
      />
    </>
  );
}

export function SectionEducation({
  form,
  controller,
}: {
  form: ProfileForm;
  controller: ProfileFieldArrayController<EducationEntry>;
}) {
  return (
    <EntryList
      form={form}
      name="education"
      noun="school"
      controller={controller}
      summarize={(entry) => summarizeRole(entry.degree, entry.school)}
    >
      {(index) => <EducationFields form={form} index={index} />}
    </EntryList>
  );
}
