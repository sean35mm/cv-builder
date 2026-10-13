'use client';

import { EntryList } from '@/components/editor/entry-list';
import {
  FieldGrid,
  TagField,
  TextField,
  type ProfileForm,
} from '@/components/editor/fields';
import type { ProfileFieldArrayController } from '@/components/editor/hooks/use-profile-field-arrays';
import type { PublicationEntry } from '@/lib/profile/domain';

export function SectionPublications({
  form,
  controller,
}: {
  form: ProfileForm;
  controller: ProfileFieldArrayController<PublicationEntry>;
}) {
  return (
    <EntryList
      form={form}
      name="publications"
      noun="publication"
      controller={controller}
      summarize={(entry) => entry.title.trim()}
    >
      {(index) => (
        <>
          <TextField
            form={form}
            name={`publications.${index}.title`}
            label="Title"
            maxLength={200}
          />
          <FieldGrid>
            <TextField
              form={form}
              name={`publications.${index}.publisher`}
              label="Publisher"
              maxLength={160}
            />
            <TextField
              form={form}
              name={`publications.${index}.date`}
              label="Date"
              placeholder="2024 or March 2024"
              maxLength={100}
            />
          </FieldGrid>
          <TextField
            form={form}
            name={`publications.${index}.url`}
            label="Link"
            type="url"
            inputMode="url"
            placeholder="https://"
            maxLength={500}
          />
          <TagField
            form={form}
            name={`publications.${index}.authors`}
            label="Authors"
            placeholder="Add an author and press Enter"
            maxItems={20}
            maxLength={120}
          />
          <TextField
            form={form}
            name={`publications.${index}.description`}
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
