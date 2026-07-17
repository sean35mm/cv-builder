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
  hint,
  onAdd,
  label,
}: {
  hint: string;
  onAdd: () => void;
  label: string;
}) {
  return (
    <div className="border-y border-dashed py-8 text-center">
      <p className="text-sm text-muted-foreground mb-4">{hint}</p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-[2px] bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="h-3.5 w-3.5" />
        {label}
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
      return (
        <>
          {fieldArrays.experience.fields.length === 0 && (
            <EmptySection
              hint="Add your work history to showcase your professional background."
              onAdd={fieldArrays.experience.add}
              label="Add Experience"
            />
          )}
          <SectionExperience
            form={form}
            fields={fieldArrays.experience.fields}
            onAdd={fieldArrays.experience.add}
            onRemove={fieldArrays.experience.remove}
            onMove={fieldArrays.experience.move}
          />
        </>
      );
    case 'education':
      return (
        <>
          {fieldArrays.education.fields.length === 0 && (
            <EmptySection
              hint="Add your educational background -- degrees, bootcamps, or courses."
              onAdd={fieldArrays.education.add}
              label="Add Education"
            />
          )}
          <SectionEducation
            form={form}
            fields={fieldArrays.education.fields}
            onAdd={fieldArrays.education.add}
            onRemove={fieldArrays.education.remove}
            onMove={fieldArrays.education.move}
          />
        </>
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
      return (
        <>
          {fieldArrays.languages.fields.length === 0 && (
            <EmptySection
              hint="List the languages you use and optionally describe your proficiency."
              onAdd={fieldArrays.languages.add}
              label="Add Language"
            />
          )}
          <SectionLanguages
            form={form}
            fields={fieldArrays.languages.fields}
            onAdd={fieldArrays.languages.add}
            onRemove={fieldArrays.languages.remove}
            onMove={fieldArrays.languages.move}
          />
        </>
      );
    case 'projects':
      return (
        <>
          {fieldArrays.projects.fields.length === 0 && (
            <EmptySection
              hint="Highlight side projects, open-source work, or anything you've built."
              onAdd={fieldArrays.projects.add}
              label="Add Project"
            />
          )}
          <SectionProjects
            form={form}
            fields={fieldArrays.projects.fields}
            onAdd={fieldArrays.projects.add}
            onRemove={fieldArrays.projects.remove}
            onMove={fieldArrays.projects.move}
          />
        </>
      );
    case 'certifications':
      return (
        <>
          {fieldArrays.certifications.fields.length === 0 && (
            <EmptySection
              hint="List professional certifications, licenses, or credentials."
              onAdd={fieldArrays.certifications.add}
              label="Add Certification"
            />
          )}
          <SectionCertifications
            form={form}
            fields={fieldArrays.certifications.fields}
            onAdd={fieldArrays.certifications.add}
            onRemove={fieldArrays.certifications.remove}
            onMove={fieldArrays.certifications.move}
          />
        </>
      );
    case 'publications':
      return (
        <>
          {fieldArrays.publications.fields.length === 0 && (
            <EmptySection
              hint="Add articles, books, papers, or other published work."
              onAdd={fieldArrays.publications.add}
              label="Add Publication"
            />
          )}
          <SectionPublications
            form={form}
            fields={fieldArrays.publications.fields}
            onAdd={fieldArrays.publications.add}
            onRemove={fieldArrays.publications.remove}
            onMove={fieldArrays.publications.move}
          />
        </>
      );
    case 'volunteering':
      return (
        <>
          {fieldArrays.volunteering.fields.length === 0 && (
            <EmptySection
              hint="Share volunteer work, mentoring, or community involvement."
              onAdd={fieldArrays.volunteering.add}
              label="Add Volunteering"
            />
          )}
          <SectionVolunteering
            form={form}
            fields={fieldArrays.volunteering.fields}
            onAdd={fieldArrays.volunteering.add}
            onRemove={fieldArrays.volunteering.remove}
            onMove={fieldArrays.volunteering.move}
          />
        </>
      );
    case 'exhibitions':
      return (
        <>
          {fieldArrays.exhibitions.fields.length === 0 && (
            <EmptySection
              hint="Showcase exhibitions, gallery shows, or public presentations of your work."
              onAdd={fieldArrays.exhibitions.add}
              label="Add Exhibition"
            />
          )}
          <SectionExhibitions
            form={form}
            fields={fieldArrays.exhibitions.fields}
            onAdd={fieldArrays.exhibitions.add}
            onRemove={fieldArrays.exhibitions.remove}
            onMove={fieldArrays.exhibitions.move}
          />
        </>
      );
    case 'awards':
      return (
        <>
          {fieldArrays.awards.fields.length === 0 && (
            <EmptySection
              hint="Add honors, awards, or recognition you've received."
              onAdd={fieldArrays.awards.add}
              label="Add Award"
            />
          )}
          <SectionAwards
            form={form}
            fields={fieldArrays.awards.fields}
            onAdd={fieldArrays.awards.add}
            onRemove={fieldArrays.awards.remove}
            onMove={fieldArrays.awards.move}
          />
        </>
      );
    case 'interests':
      return <SectionInterests form={form} />;
    default:
      return null;
  }
}
