'use client';

import { useWatch } from 'react-hook-form';

import { EntryList } from '@/components/editor/entry-list';
import {
  FieldGrid,
  updateEntryImages,
  TextField,
  YearField,
  type ProfileForm,
} from '@/components/editor/fields';
import type { ProfileFieldArrayController } from '@/components/editor/hooks/use-profile-field-arrays';
import { ManagedMediaUploader } from '@/components/editor/managed-media-uploader';
import type { ExhibitionEntry } from '@/lib/profile/domain';
import { MAX_MANAGED_IMAGES_PER_ENTRY } from '@/lib/profile/media';

function ExhibitionFields({
  form,
  index,
}: {
  form: ProfileForm;
  index: number;
}) {
  const images =
    useWatch({
      control: form.control,
      name: `exhibitions.${index}.images`,
    }) ?? [];
  const entryId = useWatch({
    control: form.control,
    name: `exhibitions.${index}.id`,
  });
  return (
    <>
      <FieldGrid>
        <TextField
          form={form}
          name={`exhibitions.${index}.title`}
          label="Title"
          maxLength={160}
        />
        <YearField
          form={form}
          name={`exhibitions.${index}.year`}
          label="Year"
        />
        <TextField
          form={form}
          name={`exhibitions.${index}.venue`}
          label="Venue"
          maxLength={160}
        />
        <TextField
          form={form}
          name={`exhibitions.${index}.location`}
          label="Location"
          maxLength={160}
        />
      </FieldGrid>
      <TextField
        form={form}
        name={`exhibitions.${index}.link`}
        label="Link"
        type="url"
        inputMode="url"
        placeholder="https://"
        maxLength={500}
      />
      <TextField
        form={form}
        name={`exhibitions.${index}.description`}
        label="Description"
        multiline
        maxLength={1000}
        counter
      />
      <ManagedMediaUploader
        images={images}
        label="Images"
        maxImages={MAX_MANAGED_IMAGES_PER_ENTRY}
        subject={`exhibition ${index + 1}`}
        onChange={(update) =>
          updateEntryImages(form, 'exhibitions', entryId, update)
        }
      />
    </>
  );
}

export function SectionExhibitions({
  form,
  controller,
}: {
  form: ProfileForm;
  controller: ProfileFieldArrayController<ExhibitionEntry>;
}) {
  return (
    <EntryList
      form={form}
      name="exhibitions"
      noun="exhibition"
      controller={controller}
      summarize={(entry) => entry.title.trim()}
    >
      {(index) => <ExhibitionFields form={form} index={index} />}
    </EntryList>
  );
}
