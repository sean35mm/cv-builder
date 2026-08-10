'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { ProfileFieldArrays } from '@/components/editor/hooks/use-profile-field-arrays';
import { SectionAwards } from '@/components/editor/section-awards';
import { SectionCertifications } from '@/components/editor/section-certifications';
import { SectionEducation } from '@/components/editor/section-education';
import { SectionExhibitions } from '@/components/editor/section-exhibitions';
import { SectionExperience } from '@/components/editor/section-experience';
import { SectionGeneral } from '@/components/editor/section-general';
import { SectionInterests } from '@/components/editor/section-interests';
import { SectionLanguages } from '@/components/editor/section-languages';
import { SectionProjects } from '@/components/editor/section-projects';
import { SectionPublications } from '@/components/editor/section-publications';
import { SectionSkills } from '@/components/editor/section-skills';
import { SectionVolunteering } from '@/components/editor/section-volunteering';
import type { SectionId } from '@/lib/profile/domain';
import type { ProfileUpdateFormValues } from '@/lib/profile/editor';

function EmptySection({
  onAdd,
  sectionName,
}: {
  onAdd: () => void;
  sectionName: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-y border-border py-5">
      <h3 className="text-lg font-medium text-foreground">{sectionName}</h3>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex min-h-11 items-center gap-1.5 rounded bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        Add
      </button>
    </div>
  );
}

export function ProfileEditorSection({
  activeSection,
  form,
  fieldArrays,
}: {
  activeSection: SectionId;
  form: UseFormReturn<ProfileUpdateFormValues>;
  fieldArrays: ProfileFieldArrays;
}) {
  const [newSkill, setNewSkill] = useState('');

  switch (activeSection) {
    case 'header':
      return <SectionGeneral form={form} />;
    case 'experience':
      return fieldArrays.experience.fields.length === 0 ? (
        <EmptySection
          sectionName="Experience"
          onAdd={fieldArrays.experience.add}
        />
      ) : (
        <SectionExperience
          form={form}
          fields={fieldArrays.experience.fields}
          onAdd={fieldArrays.experience.add}
          onRemove={fieldArrays.experience.remove}
          onMove={fieldArrays.experience.move}
        />
      );
    case 'education':
      return fieldArrays.education.fields.length === 0 ? (
        <EmptySection
          sectionName="Education"
          onAdd={fieldArrays.education.add}
        />
      ) : (
        <SectionEducation
          form={form}
          fields={fieldArrays.education.fields}
          onAdd={fieldArrays.education.add}
          onRemove={fieldArrays.education.remove}
          onMove={fieldArrays.education.move}
        />
      );
    case 'skills':
      return (
        <SectionSkills
          form={form}
          newSkill={newSkill}
          onChangeNewSkill={setNewSkill}
        />
      );
    case 'languages':
      return fieldArrays.languages.fields.length === 0 ? (
        <EmptySection
          sectionName="Languages"
          onAdd={fieldArrays.languages.add}
        />
      ) : (
        <SectionLanguages
          form={form}
          fields={fieldArrays.languages.fields}
          onAdd={fieldArrays.languages.add}
          onRemove={fieldArrays.languages.remove}
          onMove={fieldArrays.languages.move}
        />
      );
    case 'projects':
      return fieldArrays.projects.fields.length === 0 ? (
        <EmptySection sectionName="Projects" onAdd={fieldArrays.projects.add} />
      ) : (
        <SectionProjects
          form={form}
          fields={fieldArrays.projects.fields}
          onAdd={fieldArrays.projects.add}
          onRemove={fieldArrays.projects.remove}
          onMove={fieldArrays.projects.move}
        />
      );
    case 'certifications':
      return fieldArrays.certifications.fields.length === 0 ? (
        <EmptySection
          sectionName="Certifications"
          onAdd={fieldArrays.certifications.add}
        />
      ) : (
        <SectionCertifications
          form={form}
          fields={fieldArrays.certifications.fields}
          onAdd={fieldArrays.certifications.add}
          onRemove={fieldArrays.certifications.remove}
          onMove={fieldArrays.certifications.move}
        />
      );
    case 'publications':
      return fieldArrays.publications.fields.length === 0 ? (
        <EmptySection
          sectionName="Publications"
          onAdd={fieldArrays.publications.add}
        />
      ) : (
        <SectionPublications
          form={form}
          fields={fieldArrays.publications.fields}
          onAdd={fieldArrays.publications.add}
          onRemove={fieldArrays.publications.remove}
          onMove={fieldArrays.publications.move}
        />
      );
    case 'volunteering':
      return fieldArrays.volunteering.fields.length === 0 ? (
        <EmptySection
          sectionName="Volunteering"
          onAdd={fieldArrays.volunteering.add}
        />
      ) : (
        <SectionVolunteering
          form={form}
          fields={fieldArrays.volunteering.fields}
          onAdd={fieldArrays.volunteering.add}
          onRemove={fieldArrays.volunteering.remove}
          onMove={fieldArrays.volunteering.move}
        />
      );
    case 'exhibitions':
      return fieldArrays.exhibitions.fields.length === 0 ? (
        <EmptySection
          sectionName="Exhibitions"
          onAdd={fieldArrays.exhibitions.add}
        />
      ) : (
        <SectionExhibitions
          form={form}
          fields={fieldArrays.exhibitions.fields}
          onAdd={fieldArrays.exhibitions.add}
          onRemove={fieldArrays.exhibitions.remove}
          onMove={fieldArrays.exhibitions.move}
        />
      );
    case 'awards':
      return fieldArrays.awards.fields.length === 0 ? (
        <EmptySection sectionName="Awards" onAdd={fieldArrays.awards.add} />
      ) : (
        <SectionAwards
          form={form}
          fields={fieldArrays.awards.fields}
          onAdd={fieldArrays.awards.add}
          onRemove={fieldArrays.awards.remove}
          onMove={fieldArrays.awards.move}
        />
      );
    case 'interests':
      return <SectionInterests form={form} />;
    default:
      return null;
  }
}
