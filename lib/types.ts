import type { FieldValues } from 'react-hook-form';
import type { Doc } from '@/convex/_generated/dataModel';

export const SECTION_IDS = [
  'header',
  'bio',
  'contact',
  'experience',
  'education',
  'skills',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const DEFAULT_SECTIONS_ORDER: SectionId[] = [
  'header',
  'bio',
  'contact',
  'experience',
  'education',
  'skills',
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
