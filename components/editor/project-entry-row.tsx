'use client';

import { useWatch } from 'react-hook-form';

import {
  CheckboxField,
  FieldGrid,
  SelectField,
  TagField,
  TextField,
  YearField,
  type ProfileForm,
} from '@/components/editor/fields';
import { ManagedMediaUploader } from '@/components/editor/managed-media-uploader';
import { MAX_MANAGED_IMAGES_PER_ENTRY } from '@/lib/profile/media';

const PROJECT_CATEGORIES = [
  'Web Application',
  'Mobile App',
  'Desktop App',
  'API/Backend',
  'Open Source',
  'Design',
  'Data/ML',
  'Other',
].map((value) => ({ value, label: value }));

export function ProjectFields({
  form,
  index,
}: {
  form: ProfileForm;
  index: number;
}) {
  const images =
    useWatch({ control: form.control, name: `projects.${index}.images` }) ?? [];

  return (
    <>
      <FieldGrid>
        <TextField
          form={form}
          name={`projects.${index}.title`}
          label="Title"
          maxLength={160}
        />
        <YearField form={form} name={`projects.${index}.year`} label="Year" />
        <TextField
          form={form}
          name={`projects.${index}.company`}
          label="Company or client"
          maxLength={160}
        />
        <SelectField
          form={form}
          name={`projects.${index}.category`}
          label="Category"
          emptyLabel="None"
          options={PROJECT_CATEGORIES}
        />
      </FieldGrid>
      <TextField
        form={form}
        name={`projects.${index}.link`}
        label="Link"
        type="url"
        inputMode="url"
        placeholder="https://"
        maxLength={500}
      />
      <TextField
        form={form}
        name={`projects.${index}.description`}
        label="Description"
        multiline
        maxLength={1000}
        counter
      />
      <TagField
        form={form}
        name={`projects.${index}.technologies`}
        label="Technologies"
        placeholder="Add a technology and press Enter"
        maxItems={30}
        maxLength={50}
      />
      <ManagedMediaUploader
        images={images}
        label="Images"
        maxImages={MAX_MANAGED_IMAGES_PER_ENTRY}
        subject={`project ${index + 1}`}
        onChange={(next) =>
          form.setValue(`projects.${index}.images`, next, {
            shouldDirty: true,
          })
        }
      />
      <CheckboxField
        form={form}
        name={`projects.${index}.isFeatured`}
        label="Feature this project"
      />
    </>
  );
}
