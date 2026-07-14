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
  'testimonials',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const DEFAULT_SECTIONS_ORDER: SectionId[] = [...SECTION_IDS];

export type ExperienceEntry = {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
};

export type EducationEntry = {
  id: string;
  degree: string;
  school: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
};

export type ProjectEntry = {
  id: string;
  title: string;
  year: string;
  company?: string;
  link?: string;
  description?: string;
  images?: string[];
  technologies?: string[];
  category?: string;
  isFeatured?: boolean;
};

export type CertificationEntry = {
  id: string;
  name: string;
  issuer: string;
  year?: string;
  credentialId?: string;
  link?: string;
  description?: string;
};

export type VolunteeringEntry = {
  id: string;
  role: string;
  organization: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
};

export type ExhibitionEntry = {
  id: string;
  title: string;
  venue?: string;
  year: string;
  location?: string;
  link?: string;
  description?: string;
};

export type AwardEntry = {
  id: string;
  title: string;
  issuer: string;
  year: string;
  link?: string;
  description?: string;
};

export type ProfileUpdateInput = {
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
};

export type ProfileContent = {
  username: string;
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
};

export type SectionsVisibility = Record<string, boolean>;

export type ProfileTestimonial = {
  _id: string;
  authorName: string;
  authorTitle?: string;
  authorCompany?: string;
  relationship: string;
  content: string;
  rating?: number;
  createdAt: number;
};

export type ResumeVersion = {
  _id: string;
  name: string;
  isDefault: boolean;
  sectionsVisibility: SectionsVisibility;
  sectionsOrder?: SectionId[];
  createdAt: number;
  updatedAt: number;
};

export type ResumeVersionSummary = {
  _id: string;
  name: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
};
