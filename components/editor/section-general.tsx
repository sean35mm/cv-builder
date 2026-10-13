'use client';

import { useWatch } from 'react-hook-form';

import {
  FieldGrid,
  TextField,
  type ProfileForm,
} from '@/components/editor/fields';
import { ManagedMediaUploader } from '@/components/editor/managed-media-uploader';

export function SectionGeneral({ form }: { form: ProfileForm }) {
  const avatar = useWatch({ control: form.control, name: 'avatar' });

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <ManagedMediaUploader
          images={avatar ? [avatar] : []}
          label="Photo"
          maxImages={1}
          subject="profile photo"
          avatar
          onChange={(update) => {
            const current = form.getValues('avatar');
            const next = update(current ? [current] : []);
            form.setValue('avatar', next.at(-1) ?? '', { shouldDirty: true });
          }}
        />
        <FieldGrid>
          <TextField
            form={form}
            name="name"
            label="Name"
            maxLength={120}
            autoComplete="name"
          />
          <TextField
            form={form}
            name="title"
            label="Headline"
            placeholder="Product designer"
            maxLength={120}
          />
          <TextField
            form={form}
            name="location"
            label="Location"
            maxLength={120}
          />
          <TextField
            form={form}
            name="industry"
            label="Industry"
            maxLength={120}
          />
        </FieldGrid>
        <TextField
          form={form}
          name="bio"
          label="About"
          multiline
          maxLength={300}
          counter
        />
      </div>

      <section aria-labelledby="links-heading" className="space-y-4">
        <h3
          id="links-heading"
          className="border-t border-border pt-6 text-[13px] font-medium text-foreground"
        >
          Contact and links
        </h3>
        <FieldGrid>
          <TextField
            form={form}
            name="email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
          />
          <TextField
            form={form}
            name="website"
            label="Website"
            type="url"
            inputMode="url"
            placeholder="https://"
            maxLength={500}
          />
          <TextField
            form={form}
            name="github"
            label="GitHub"
            placeholder="username"
            maxLength={120}
          />
          <TextField
            form={form}
            name="linkedin"
            label="LinkedIn"
            placeholder="username"
            maxLength={120}
          />
          <TextField
            form={form}
            name="twitter"
            label="X"
            placeholder="username"
            maxLength={120}
          />
        </FieldGrid>
      </section>
    </div>
  );
}
