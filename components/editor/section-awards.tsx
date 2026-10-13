'use client';

import { useWatch } from 'react-hook-form';

import { EntryList } from '@/components/editor/entry-list';
import {
  FieldGrid,
  TextField,
  YearField,
  type ProfileForm,
} from '@/components/editor/fields';
import type { ProfileFieldArrayController } from '@/components/editor/hooks/use-profile-field-arrays';
import { ManagedMediaUploader } from '@/components/editor/managed-media-uploader';
import { summarizeRole } from '@/components/editor/section-experience';
import type { AwardEntry } from '@/lib/profile/domain';
import { MAX_MANAGED_IMAGES_PER_ENTRY } from '@/lib/profile/media';

function AwardFields({ form, index }: { form: ProfileForm; index: number }) {
  const images =
    useWatch({ control: form.control, name: `awards.${index}.images` }) ?? [];
  return (
    <>
      <FieldGrid>
        <TextField
          form={form}
          name={`awards.${index}.title`}
          label="Title"
          maxLength={160}
        />
        <TextField
          form={form}
          name={`awards.${index}.issuer`}
          label="Issuer"
          maxLength={160}
        />
        <YearField form={form} name={`awards.${index}.year`} label="Year" />
      </FieldGrid>
      <TextField
        form={form}
        name={`awards.${index}.link`}
        label="Link"
        type="url"
        inputMode="url"
        placeholder="https://"
        maxLength={500}
      />
      <TextField
        form={form}
        name={`awards.${index}.description`}
        label="Description"
        multiline
        maxLength={1000}
        counter
      />
      <ManagedMediaUploader
        images={images}
        label="Images"
        maxImages={MAX_MANAGED_IMAGES_PER_ENTRY}
        subject={`award ${index + 1}`}
        onChange={(next) =>
          form.setValue(`awards.${index}.images`, next, { shouldDirty: true })
        }
      />
    </>
  );
}

export function SectionAwards({
  form,
  controller,
}: {
  form: ProfileForm;
  controller: ProfileFieldArrayController<AwardEntry>;
}) {
  return (
    <EntryList
      form={form}
      name="awards"
      noun="award"
      controller={controller}
      summarize={(entry) => summarizeRole(entry.title, entry.issuer)}
    >
      {(index) => <AwardFields form={form} index={index} />}
    </EntryList>
  );
}
