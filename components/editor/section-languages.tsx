'use client';

import { EntryList } from '@/components/editor/entry-list';
import {
  FieldGrid,
  SelectField,
  TextField,
  type ProfileForm,
} from '@/components/editor/fields';
import type { ProfileFieldArrayController } from '@/components/editor/hooks/use-profile-field-arrays';
import {
  LANGUAGE_PROFICIENCIES,
  LANGUAGE_PROFICIENCY_LABELS,
  type LanguageEntry,
} from '@/lib/profile/domain';

const PROFICIENCY_OPTIONS = LANGUAGE_PROFICIENCIES.map((value) => ({
  value,
  label: LANGUAGE_PROFICIENCY_LABELS[value],
}));

export function SectionLanguages({
  form,
  controller,
}: {
  form: ProfileForm;
  controller: ProfileFieldArrayController<LanguageEntry>;
}) {
  return (
    <EntryList
      form={form}
      name="languages"
      noun="language"
      controller={controller}
      summarize={(entry) => entry.name.trim()}
    >
      {(index) => (
        <FieldGrid>
          <TextField
            form={form}
            name={`languages.${index}.name`}
            label="Language"
            maxLength={100}
          />
          <SelectField
            form={form}
            name={`languages.${index}.proficiency`}
            label="Proficiency"
            emptyLabel="Not specified"
            options={PROFICIENCY_OPTIONS}
          />
        </FieldGrid>
      )}
    </EntryList>
  );
}
