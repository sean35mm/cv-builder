'use client';

import { EntryList } from '@/components/editor/entry-list';
import {
  FieldGrid,
  TextField,
  YearField,
  type ProfileForm,
} from '@/components/editor/fields';
import type { ProfileFieldArrayController } from '@/components/editor/hooks/use-profile-field-arrays';
import { summarizeRole } from '@/components/editor/section-experience';
import type { CertificationEntry } from '@/lib/profile/domain';

export function SectionCertifications({
  form,
  controller,
}: {
  form: ProfileForm;
  controller: ProfileFieldArrayController<CertificationEntry>;
}) {
  return (
    <EntryList
      form={form}
      name="certifications"
      noun="certification"
      controller={controller}
      summarize={(entry) => summarizeRole(entry.name, entry.issuer)}
    >
      {(index) => (
        <>
          <FieldGrid>
            <TextField
              form={form}
              name={`certifications.${index}.name`}
              label="Name"
              maxLength={160}
            />
            <TextField
              form={form}
              name={`certifications.${index}.issuer`}
              label="Issuer"
              maxLength={160}
            />
            <YearField
              form={form}
              name={`certifications.${index}.year`}
              label="Year"
            />
            <TextField
              form={form}
              name={`certifications.${index}.credentialId`}
              label="Credential ID"
              maxLength={160}
            />
          </FieldGrid>
          <TextField
            form={form}
            name={`certifications.${index}.link`}
            label="Link"
            type="url"
            inputMode="url"
            placeholder="https://"
            maxLength={500}
          />
          <TextField
            form={form}
            name={`certifications.${index}.description`}
            label="Description"
            multiline
            maxLength={1000}
            counter
          />
        </>
      )}
    </EntryList>
  );
}
