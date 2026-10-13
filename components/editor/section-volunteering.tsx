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
import type { VolunteeringEntry } from '@/lib/profile/domain';

function VolunteeringFields({
  form,
  index,
}: {
  form: ProfileForm;
  index: number;
}) {
  const current = useWatch({
    control: form.control,
    name: `volunteering.${index}.current`,
  });
  return (
    <>
      <FieldGrid>
        <TextField
          form={form}
          name={`volunteering.${index}.role`}
          label="Role"
          maxLength={160}
        />
        <TextField
          form={form}
          name={`volunteering.${index}.organization`}
          label="Organization"
          maxLength={160}
        />
        <MonthField
          form={form}
          name={`volunteering.${index}.startDate`}
          label="Start"
        />
        <MonthField
          form={form}
          name={`volunteering.${index}.endDate`}
          label="End"
          disabled={current}
        />
      </FieldGrid>
      <CheckboxField
        form={form}
        name={`volunteering.${index}.current`}
        label="I currently volunteer here"
        onCheckedChange={(checked) => {
          if (checked) {
            form.setValue(`volunteering.${index}.endDate`, '', {
              shouldValidate: true,
            });
          }
        }}
      />
      <TextField
        form={form}
        name={`volunteering.${index}.description`}
        label="Description"
        multiline
        maxLength={1000}
        counter
      />
    </>
  );
}

export function SectionVolunteering({
  form,
  controller,
}: {
  form: ProfileForm;
  controller: ProfileFieldArrayController<VolunteeringEntry>;
}) {
  return (
    <EntryList
      form={form}
      name="volunteering"
      noun="role"
      controller={controller}
      summarize={(entry) => summarizeRole(entry.role, entry.organization)}
    >
      {(index) => <VolunteeringFields form={form} index={index} />}
    </EntryList>
  );
}
