import type { ProfileContent, SectionId } from '@/lib/types';
import { ProjectsSection } from './ProjectsSection';
import { VolunteeringSection } from './VolunteeringSection';
import { CertificationsSection } from './CertificationsSection';
import { ExhibitionsSection } from './ExhibitionsSection';
import { AwardsSection } from './AwardsSection';
import { JSX } from 'react';

export type SectionDescriptor = {
  isVisible: (profile: ProfileContent) => boolean;
  Component: (props: { profile: ProfileContent }) => JSX.Element | null;
};

export const SECTION_REGISTRY: Record<SectionId, SectionDescriptor> = {
  header: {
    isVisible: () => true,
    Component: () => null,
  },
  bio: {
    isVisible: () => false,
    Component: () => null,
  },
  contact: {
    isVisible: () => false,
    Component: () => null,
  },
  experience: {
    isVisible: (p) => Array.isArray(p.experience) && p.experience.length > 0,
    Component: () => null,
  },
  education: {
    isVisible: (p) => Array.isArray(p.education) && p.education.length > 0,
    Component: () => null,
  },
  skills: {
    isVisible: (p) => Array.isArray(p.skills) && p.skills.length > 0,
    Component: () => null,
  },
  projects: {
    isVisible: (p) => Array.isArray(p.projects) && p.projects.length > 0,
    Component: ProjectsSection,
  },
  certifications: {
    isVisible: (p) =>
      Array.isArray(p.certifications) && p.certifications.length > 0,
    Component: CertificationsSection,
  },
  volunteering: {
    isVisible: (p) =>
      Array.isArray(p.volunteering) && p.volunteering.length > 0,
    Component: VolunteeringSection,
  },
  exhibitions: {
    isVisible: (p) => Array.isArray(p.exhibitions) && p.exhibitions.length > 0,
    Component: ExhibitionsSection,
  },
  awards: {
    isVisible: (p) => Array.isArray(p.awards) && p.awards.length > 0,
    Component: AwardsSection,
  },
};
