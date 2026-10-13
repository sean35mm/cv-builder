'use client';

import { EntryList } from '@/components/editor/entry-list';
import type { ProfileForm } from '@/components/editor/fields';
import type { ProfileFieldArrayController } from '@/components/editor/hooks/use-profile-field-arrays';
import { ProjectFields } from '@/components/editor/project-entry-row';
import type { ProjectEntry } from '@/lib/profile/domain';

export function SectionProjects({
  form,
  controller,
}: {
  form: ProfileForm;
  controller: ProfileFieldArrayController<ProjectEntry>;
}) {
  return (
    <EntryList
      form={form}
      name="projects"
      noun="project"
      controller={controller}
      summarize={(entry) => entry.title.trim()}
    >
      {(index) => <ProjectFields form={form} index={index} />}
    </EntryList>
  );
}
