'use client';

import type { ProfileForm } from '@/components/editor/fields';
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
import { SectionTestimonials } from '@/components/editor/section-testimonials';
import { SectionVolunteering } from '@/components/editor/section-volunteering';
import type { SectionId } from '@/lib/profile/domain';

export function ProfileEditorSection({
  section,
  form,
  fieldArrays,
}: {
  section: SectionId;
  form: ProfileForm;
  fieldArrays: ProfileFieldArrays;
}) {
  switch (section) {
    case 'header':
      return <SectionGeneral form={form} />;
    case 'experience':
      return (
        <SectionExperience form={form} controller={fieldArrays.experience} />
      );
    case 'education':
      return (
        <SectionEducation form={form} controller={fieldArrays.education} />
      );
    case 'skills':
      return <SectionSkills form={form} />;
    case 'languages':
      return (
        <SectionLanguages form={form} controller={fieldArrays.languages} />
      );
    case 'projects':
      return <SectionProjects form={form} controller={fieldArrays.projects} />;
    case 'publications':
      return (
        <SectionPublications
          form={form}
          controller={fieldArrays.publications}
        />
      );
    case 'certifications':
      return (
        <SectionCertifications
          form={form}
          controller={fieldArrays.certifications}
        />
      );
    case 'volunteering':
      return (
        <SectionVolunteering
          form={form}
          controller={fieldArrays.volunteering}
        />
      );
    case 'exhibitions':
      return (
        <SectionExhibitions form={form} controller={fieldArrays.exhibitions} />
      );
    case 'awards':
      return <SectionAwards form={form} controller={fieldArrays.awards} />;
    case 'interests':
      return <SectionInterests form={form} />;
    case 'testimonials':
      return <SectionTestimonials />;
    default:
      return null;
  }
}
