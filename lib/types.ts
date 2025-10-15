import type { FieldValues } from 'react-hook-form';
import type { Doc } from '@/convex/_generated/dataModel';

export const SECTION_IDS = [
  'header',
  'bio',
  'contact',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'volunteering',
  'exhibitions',
  'awards',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const DEFAULT_SECTIONS_ORDER: SectionId[] = [
  'header',
  'bio',
  'contact',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'volunteering',
  'exhibitions',
  'awards',
];

export type TabId = 'basic' | 'experience' | 'education' | 'skills';

export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface EducationEntry {
  id: string;
  degree: string;
  school: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface ProjectEntry {
  id: string;
  title: string;
  year: string; // YYYY
  company?: string;
  link?: string;
  description?: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  year?: string; // YYYY
  credentialId?: string;
  link?: string;
  description?: string;
}

export interface VolunteeringEntry {
  id: string;
  role: string;
  organization: string;
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM
  current: boolean;
  description?: string;
}

export interface ExhibitionEntry {
  id: string;
  title: string;
  venue?: string;
  year: string; // YYYY
  location?: string;
  link?: string;
  description?: string;
}

export interface AwardEntry {
  id: string;
  title: string;
  issuer: string;
  year: string; // YYYY
  link?: string;
  description?: string;
}

export interface ProfileUpdateInput {
  name: string;
  title?: string;
  location?: string;
  bio?: string;
  email?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  volunteering: VolunteeringEntry[];
  exhibitions: ExhibitionEntry[];
  awards: AwardEntry[];
  sectionsOrder?: SectionId[];
  isPublic: boolean;
}

export interface ProfileUpdateFormValues extends FieldValues {
  name: string;
  title?: string;
  location?: string;
  bio?: string;
  email?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  volunteering: VolunteeringEntry[];
  exhibitions: ExhibitionEntry[];
  awards: AwardEntry[];
  sectionsOrder?: SectionId[];
  isPublic: boolean;
}

export interface ProfileEditorProps {
  profile: Doc<'profiles'>;
}

export interface MonthInputProps {
  value?: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export interface ProfileContent {
  name: string;
  title?: string;
  location?: string;
  bio?: string;
  email?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  volunteering: VolunteeringEntry[];
  exhibitions: ExhibitionEntry[];
  awards: AwardEntry[];
  sectionsOrder?: SectionId[];
}

export interface ProfilePreviewProps {
  profile: ProfileContent;
  sectionsOrder?: SectionId[];
  onReorderSections?: (next: SectionId[]) => void;
  onReorderExperience?: (next: ExperienceEntry[]) => void;
  onReorderEducation?: (next: EducationEntry[]) => void;
  onReorderSkills?: (next: string[]) => void;
  showDragHandles?: boolean;
}
