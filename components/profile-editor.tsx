'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useFieldArray,
  useForm,
  type Resolver,
  type FieldErrors,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';

import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
// inputs handled in extracted sections
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, GripVertical, Plus } from 'lucide-react';
// preview moved into extracted component
import { SectionGeneral } from '@/components/editor/section-general';
import { SectionExperience } from '@/components/editor/section-experience';
import { SectionEducation } from '@/components/editor/section-education';
import { SectionSkills } from '@/components/editor/section-skills';
import { SectionProjects } from '@/components/editor/section-projects';
import { SectionCertifications } from '@/components/editor/section-certifications';
import { SectionVolunteering } from '@/components/editor/section-volunteering';
import { SectionExhibitions } from '@/components/editor/section-exhibitions';
import { SectionAwards } from '@/components/editor/section-awards';
import { PreviewPane } from '@/components/editor/preview-pane';
import {
  DEFAULT_SECTIONS_ORDER,
  SECTION_IDS,
  type EducationEntry,
  type ExperienceEntry,
  type ProjectEntry,
  type CertificationEntry,
  type VolunteeringEntry,
  type ExhibitionEntry,
  type AwardEntry,
  type ProfileContent,
  type ProfileEditorProps,
  type ProfileUpdateFormValues,
  type ProfileUpdateInput,
  type SectionId,
} from '@/lib/types';

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

const monthStringSchema = z
  .string()
  .min(1, 'Select a month')
  .regex(monthRegex, 'Select a valid month (YYYY-MM)');

const optionalMonthStringSchema = z
  .string()
  .refine((value) => value === '' || monthRegex.test(value), {
    message: 'Select a valid month (YYYY-MM)',
  })
  .optional();

const yearRegex = /^\d{4}$/;
const yearStringSchema = z
  .string()
  .min(1, 'Year is required')
  .regex(yearRegex, 'Enter a 4-digit year');
const optionalYearStringSchema = z
  .string()
  .refine((value) => value === '' || yearRegex.test(value), {
    message: 'Enter a 4-digit year',
  })
  .optional();

const urlOptionalSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === '' ||
      /^https?:\/\//i.test(value) ||
      /^[\w.-]+\.[A-Za-z]{2,}(\/.*)?$/.test(value),
    { message: 'Enter a valid URL' }
  )
  .optional();

const experienceEntrySchema: z.ZodType<ExperienceEntry> = z
  .object({
    id: z.string().min(1, 'Identifier missing'),
    role: z.string().trim().min(1, 'Role is required').max(120),
    company: z.string().trim().min(1, 'Company is required').max(120),
    startDate: monthStringSchema,
    endDate: optionalMonthStringSchema,
    current: z.boolean(),
    description: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.current) {
      if (value.endDate && value.endDate !== '') {
        ctx.addIssue({
          code: 'custom',
          message: 'Clear end date when marked as current',
          path: ['endDate'],
        });
      }
      return;
    }

    const endDate = value.endDate ?? '';
    if (!endDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date required unless current',
        path: ['endDate'],
      });
      return;
    }

    if (endDate < value.startDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date cannot be before start date',
        path: ['endDate'],
      });
    }
  });

const educationEntrySchema: z.ZodType<EducationEntry> = z
  .object({
    id: z.string().min(1, 'Identifier missing'),
    degree: z.string().trim().min(1, 'Degree is required').max(120),
    school: z.string().trim().min(1, 'School is required').max(120),
    startDate: monthStringSchema,
    endDate: optionalMonthStringSchema,
    current: z.boolean(),
    description: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.current) {
      if (value.endDate && value.endDate !== '') {
        ctx.addIssue({
          code: 'custom',
          message: 'Clear end date when currently studying',
          path: ['endDate'],
        });
      }
      return;
    }

    const endDate = value.endDate ?? '';
    if (!endDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date required unless currently studying',
        path: ['endDate'],
      });
      return;
    }

    if (endDate < value.startDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date cannot be before start date',
        path: ['endDate'],
      });
    }
  });

const skillSchema = z.string().trim().min(1, 'Skill cannot be empty').max(50);

const projectEntrySchema: z.ZodType<ProjectEntry> = z.object({
  id: z.string().min(1, 'Identifier missing'),
  title: z.string().trim().min(1, 'Title is required').max(160),
  year: yearStringSchema,
  company: z.string().trim().max(160).optional(),
  link: urlOptionalSchema,
  description: z.string().trim().max(1000).optional(),
});

const certificationEntrySchema: z.ZodType<CertificationEntry> = z.object({
  id: z.string().min(1, 'Identifier missing'),
  name: z.string().trim().min(1, 'Name is required').max(160),
  issuer: z.string().trim().min(1, 'Issuer is required').max(160),
  year: optionalYearStringSchema,
  credentialId: z.string().trim().max(160).optional(),
  link: urlOptionalSchema,
  description: z.string().trim().max(1000).optional(),
});

const volunteeringEntrySchema: z.ZodType<VolunteeringEntry> = z
  .object({
    id: z.string().min(1, 'Identifier missing'),
    role: z.string().trim().min(1, 'Role is required').max(160),
    organization: z.string().trim().min(1, 'Organization is required').max(160),
    startDate: monthStringSchema,
    endDate: optionalMonthStringSchema,
    current: z.boolean(),
    description: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.current) {
      if (value.endDate && value.endDate !== '') {
        ctx.addIssue({
          code: 'custom',
          message: 'Clear end date when marked as current',
          path: ['endDate'],
        });
      }
      return;
    }
    const endDate = value.endDate ?? '';
    if (!endDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date required unless current',
        path: ['endDate'],
      });
      return;
    }
    if (endDate < value.startDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date cannot be before start date',
        path: ['endDate'],
      });
    }
  });

const exhibitionEntrySchema: z.ZodType<ExhibitionEntry> = z.object({
  id: z.string().min(1, 'Identifier missing'),
  title: z.string().trim().min(1, 'Title is required').max(160),
  venue: z.string().trim().max(160).optional(),
  year: yearStringSchema,
  location: z.string().trim().max(160).optional(),
  link: urlOptionalSchema,
  description: z.string().trim().max(1000).optional(),
});

const awardEntrySchema: z.ZodType<AwardEntry> = z.object({
  id: z.string().min(1, 'Identifier missing'),
  title: z.string().trim().min(1, 'Title is required').max(160),
  issuer: z.string().trim().min(1, 'Issuer is required').max(160),
  year: yearStringSchema,
  link: urlOptionalSchema,
  description: z.string().trim().max(1000).optional(),
});

const profileUpdateFormSchema: z.ZodType<ProfileUpdateFormValues> = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    title: z.string().trim().max(120).optional(),
    location: z.string().trim().max(120).optional(),
    bio: z.string().trim().max(300).optional(),
    email: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        {
          message: 'Enter a valid email',
        }
      )
      .optional(),
    website: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === '' ||
          /^https?:\/\//i.test(value) ||
          /^[\w.-]+\.[A-Za-z]{2,}(\/.*)?$/.test(value),
        {
          message: 'Enter a valid URL',
        }
      )
      .optional(),
    github: z.string().trim().max(120).optional(),
    linkedin: z.string().trim().max(120).optional(),
    twitter: z.string().trim().max(120).optional(),
    experience: z.array(experienceEntrySchema),
    education: z.array(educationEntrySchema),
    skills: z
      .array(skillSchema)
      .max(50, 'Keep skills list under 50 entries')
      .superRefine((skills, ctx) => {
        const normalized = skills.map((skill) => skill.toLowerCase());
        if (new Set(normalized).size !== normalized.length) {
          ctx.addIssue({
            code: 'custom',
            message: 'Skills must be unique',
          });
        }
      }),
    projects: z.array(projectEntrySchema),
    certifications: z.array(certificationEntrySchema),
    volunteering: z.array(volunteeringEntrySchema),
    exhibitions: z.array(exhibitionEntrySchema),
    awards: z.array(awardEntrySchema),
    sectionsOrder: z
      .array(z.enum(SECTION_IDS))
      .refine(
        (arr) => new Set(arr).size === arr.length,
        'Sections must be unique'
      )
      .optional(),
    isPublic: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!values.sectionsOrder) {
      return;
    }
    for (const section of values.sectionsOrder) {
      if (!SECTION_IDS.includes(section)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Unknown section',
          path: ['sectionsOrder'],
        });
        break;
      }
    }
  });

// MonthInput moved to components/editor/MonthInput and used within section components

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const optionalField = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const isSectionId = (value: string): value is SectionId =>
  SECTION_IDS.includes(value as SectionId);

const resolveSectionsOrder = (
  order?: ReadonlyArray<string>
): Array<SectionId> => {
  const result: SectionId[] = [];
  if (order) {
    for (const section of order) {
      if (isSectionId(section) && !result.includes(section)) {
        result.push(section);
      }
    }
  }

  for (const section of DEFAULT_SECTIONS_ORDER) {
    if (!result.includes(section)) {
      result.push(section);
    }
  }

  return result;
};

const normalizeExperienceForForm = (
  entry: ExperienceEntry
): ExperienceEntry => ({
  ...entry,
  endDate: entry.endDate ?? '',
  description: entry.description ?? '',
});

const normalizeEducationForForm = (entry: EducationEntry): EducationEntry => ({
  ...entry,
  endDate: entry.endDate ?? '',
  description: entry.description ?? '',
});

const normalizeProjectForForm = (entry: ProjectEntry): ProjectEntry => ({
  ...entry,
  company: entry.company ?? '',
  link: entry.link ?? '',
  description: entry.description ?? '',
});

const normalizeCertificationForForm = (
  entry: CertificationEntry
): CertificationEntry => ({
  ...entry,
  year: entry.year ?? '',
  credentialId: entry.credentialId ?? '',
  link: entry.link ?? '',
  description: entry.description ?? '',
});

const normalizeVolunteeringForForm = (
  entry: VolunteeringEntry
): VolunteeringEntry => ({
  ...entry,
  endDate: entry.endDate ?? '',
  description: entry.description ?? '',
});

const normalizeExhibitionForForm = (
  entry: ExhibitionEntry
): ExhibitionEntry => ({
  ...entry,
  venue: entry.venue ?? '',
  location: entry.location ?? '',
  link: entry.link ?? '',
  description: entry.description ?? '',
});

const normalizeAwardForForm = (entry: AwardEntry): AwardEntry => ({
  ...entry,
  link: entry.link ?? '',
  description: entry.description ?? '',
});

type ProfileDocExtended = {
  projects?: ProjectEntry[];
  certifications?: CertificationEntry[];
  volunteering?: VolunteeringEntry[];
  exhibitions?: ExhibitionEntry[];
  awards?: AwardEntry[];
};

const toFormValues = (profile: Doc<'profiles'>): ProfileUpdateFormValues => ({
  name: profile.name,
  title: profile.title ?? '',
  location: profile.location ?? '',
  bio: profile.bio ?? '',
  email: profile.email ?? '',
  website: profile.website ?? '',
  github: profile.github ?? '',
  linkedin: profile.linkedin ?? '',
  twitter: profile.twitter ?? '',
  experience: profile.experience.map((entry) =>
    normalizeExperienceForForm({
      id: entry.id,
      role: entry.role,
      company: entry.company,
      startDate: entry.startDate,
      endDate: entry.endDate ?? '',
      current: entry.current,
      description: entry.description ?? '',
    })
  ),
  education: profile.education.map((entry) =>
    normalizeEducationForForm({
      id: entry.id,
      degree: entry.degree,
      school: entry.school,
      startDate: entry.startDate,
      endDate: entry.endDate ?? '',
      current: entry.current,
      description: entry.description ?? '',
    })
  ),
  skills: profile.skills,
  projects:
    (profile as unknown as ProfileDocExtended).projects?.map(
      (entry: ProjectEntry) =>
        normalizeProjectForForm({
          id: entry.id,
          title: entry.title,
          year: entry.year,
          company: entry.company ?? '',
          link: entry.link ?? '',
          description: entry.description ?? '',
        })
    ) ?? [],
  certifications:
    (profile as unknown as ProfileDocExtended).certifications?.map(
      (entry: CertificationEntry) =>
        normalizeCertificationForForm({
          id: entry.id,
          name: entry.name,
          issuer: entry.issuer,
          year: entry.year ?? '',
          credentialId: entry.credentialId ?? '',
          link: entry.link ?? '',
          description: entry.description ?? '',
        })
    ) ?? [],
  volunteering:
    (profile as unknown as ProfileDocExtended).volunteering?.map(
      (entry: VolunteeringEntry) =>
        normalizeVolunteeringForForm({
          id: entry.id,
          role: entry.role,
          organization: entry.organization,
          startDate: entry.startDate,
          endDate: entry.endDate ?? '',
          current: entry.current,
          description: entry.description ?? '',
        })
    ) ?? [],
  exhibitions:
    (profile as unknown as ProfileDocExtended).exhibitions?.map(
      (entry: ExhibitionEntry) =>
        normalizeExhibitionForForm({
          id: entry.id,
          title: entry.title,
          venue: entry.venue ?? '',
          year: entry.year,
          location: entry.location ?? '',
          link: entry.link ?? '',
          description: entry.description ?? '',
        })
    ) ?? [],
  awards:
    (profile as unknown as ProfileDocExtended).awards?.map(
      (entry: AwardEntry) =>
        normalizeAwardForForm({
          id: entry.id,
          title: entry.title,
          issuer: entry.issuer,
          year: entry.year,
          link: entry.link ?? '',
          description: entry.description ?? '',
        })
    ) ?? [],
  sectionsOrder: resolveSectionsOrder(profile.sectionsOrder),
  isPublic: profile.isPublic,
});

const toMutationPayload = (
  values: ProfileUpdateFormValues
): ProfileUpdateInput => ({
  name: values.name.trim(),
  title: optionalField(values.title),
  location: optionalField(values.location),
  bio: optionalField(values.bio),
  email: optionalField(values.email),
  website: optionalField(values.website),
  github: optionalField(values.github),
  linkedin: optionalField(values.linkedin),
  twitter: optionalField(values.twitter),
  experience: values.experience.map((entry) => ({
    id: entry.id,
    role: entry.role.trim(),
    company: entry.company.trim(),
    startDate: entry.startDate,
    endDate:
      entry.current || !entry.endDate || entry.endDate.trim() === ''
        ? undefined
        : entry.endDate,
    current: entry.current,
    description: optionalField(entry.description),
  })),
  education: values.education.map((entry) => ({
    id: entry.id,
    degree: entry.degree.trim(),
    school: entry.school.trim(),
    startDate: entry.startDate,
    endDate:
      entry.current || !entry.endDate || entry.endDate.trim() === ''
        ? undefined
        : entry.endDate,
    current: entry.current,
    description: optionalField(entry.description),
  })),
  skills: Array.from(
    new Set(
      values.skills.map((skill) => skill.trim()).filter((skill) => skill !== '')
    )
  ),
  projects: values.projects.map((entry) => ({
    id: entry.id,
    title: entry.title.trim(),
    year: entry.year,
    company: optionalField(entry.company),
    link: optionalField(entry.link),
    description: optionalField(entry.description),
  })),
  certifications: values.certifications.map((entry) => ({
    id: entry.id,
    name: entry.name.trim(),
    issuer: entry.issuer.trim(),
    year: optionalField(entry.year),
    credentialId: optionalField(entry.credentialId),
    link: optionalField(entry.link),
    description: optionalField(entry.description),
  })),
  volunteering: values.volunteering.map((entry) => ({
    id: entry.id,
    role: entry.role.trim(),
    organization: entry.organization.trim(),
    startDate: entry.startDate,
    endDate:
      entry.current || !entry.endDate || entry.endDate.trim() === ''
        ? undefined
        : entry.endDate,
    current: entry.current,
    description: optionalField(entry.description),
  })),
  exhibitions: values.exhibitions.map((entry) => ({
    id: entry.id,
    title: entry.title.trim(),
    venue: optionalField(entry.venue),
    year: entry.year,
    location: optionalField(entry.location),
    link: optionalField(entry.link),
    description: optionalField(entry.description),
  })),
  awards: values.awards.map((entry) => ({
    id: entry.id,
    title: entry.title.trim(),
    issuer: entry.issuer.trim(),
    year: entry.year,
    link: optionalField(entry.link),
    description: optionalField(entry.description),
  })),
  sectionsOrder: values.sectionsOrder
    ? resolveSectionsOrder(values.sectionsOrder)
    : resolveSectionsOrder(),
  isPublic: values.isPublic,
});

const fromMutationPayload = (
  payload: ProfileUpdateInput
): ProfileUpdateFormValues => ({
  name: payload.name,
  title: payload.title ?? '',
  location: payload.location ?? '',
  bio: payload.bio ?? '',
  email: payload.email ?? '',
  website: payload.website ?? '',
  github: payload.github ?? '',
  linkedin: payload.linkedin ?? '',
  twitter: payload.twitter ?? '',
  experience: payload.experience.map((entry) =>
    normalizeExperienceForForm({
      id: entry.id,
      role: entry.role,
      company: entry.company,
      startDate: entry.startDate,
      endDate: entry.endDate ?? '',
      current: entry.current,
      description: entry.description ?? '',
    })
  ),
  education: payload.education.map((entry) =>
    normalizeEducationForForm({
      id: entry.id,
      degree: entry.degree,
      school: entry.school,
      startDate: entry.startDate,
      endDate: entry.endDate ?? '',
      current: entry.current,
      description: entry.description ?? '',
    })
  ),
  skills: payload.skills,
  projects: payload.projects.map((entry) =>
    normalizeProjectForForm({
      id: entry.id,
      title: entry.title,
      year: entry.year,
      company: entry.company ?? '',
      link: entry.link ?? '',
      description: entry.description ?? '',
    })
  ),
  certifications: payload.certifications.map((entry) =>
    normalizeCertificationForForm({
      id: entry.id,
      name: entry.name,
      issuer: entry.issuer,
      year: entry.year ?? '',
      credentialId: entry.credentialId ?? '',
      link: entry.link ?? '',
      description: entry.description ?? '',
    })
  ),
  volunteering: payload.volunteering.map((entry) =>
    normalizeVolunteeringForForm({
      id: entry.id,
      role: entry.role,
      organization: entry.organization,
      startDate: entry.startDate,
      endDate: entry.endDate ?? '',
      current: entry.current,
      description: entry.description ?? '',
    })
  ),
  exhibitions: payload.exhibitions.map((entry) =>
    normalizeExhibitionForForm({
      id: entry.id,
      title: entry.title,
      venue: entry.venue ?? '',
      year: entry.year,
      location: entry.location ?? '',
      link: entry.link ?? '',
      description: entry.description ?? '',
    })
  ),
  awards: payload.awards.map((entry) =>
    normalizeAwardForForm({
      id: entry.id,
      title: entry.title,
      issuer: entry.issuer,
      year: entry.year,
      link: entry.link ?? '',
      description: entry.description ?? '',
    })
  ),
  sectionsOrder: resolveSectionsOrder(payload.sectionsOrder),
  isPublic: payload.isPublic,
});

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
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="text-sm text-muted-foreground mb-4">{hint}</p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="h-3.5 w-3.5" />
        {label}
      </button>
    </div>
  );
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const defaultValues = useMemo(() => toFormValues(profile), [profile]);
  const form = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(
      profileUpdateFormSchema
    ) as Resolver<ProfileUpdateFormValues>,
    defaultValues,
    mode: 'onSubmit',
  });

  useEffect(() => {
    form.reset(toFormValues(profile));
  }, [profile, form]);

  const updateProfile = useMutation(api.profiles.updateProfile);

  const [activeSection, setActiveSection] = useState<SectionId>('header');
  const [newSkill, setNewSkill] = useState('');

  const experienceArray = useFieldArray<
    ProfileUpdateFormValues,
    'experience',
    'fieldKey'
  >({
    control: form.control,
    name: 'experience',
    keyName: 'fieldKey',
  });
  const educationArray = useFieldArray<
    ProfileUpdateFormValues,
    'education',
    'fieldKey'
  >({
    control: form.control,
    name: 'education',
    keyName: 'fieldKey',
  });

  const projectsArray = useFieldArray<
    ProfileUpdateFormValues,
    'projects',
    'fieldKey'
  >({
    control: form.control,
    name: 'projects',
    keyName: 'fieldKey',
  });
  const certificationsArray = useFieldArray<
    ProfileUpdateFormValues,
    'certifications',
    'fieldKey'
  >({
    control: form.control,
    name: 'certifications',
    keyName: 'fieldKey',
  });
  const volunteeringArray = useFieldArray<
    ProfileUpdateFormValues,
    'volunteering',
    'fieldKey'
  >({
    control: form.control,
    name: 'volunteering',
    keyName: 'fieldKey',
  });
  const exhibitionsArray = useFieldArray<
    ProfileUpdateFormValues,
    'exhibitions',
    'fieldKey'
  >({
    control: form.control,
    name: 'exhibitions',
    keyName: 'fieldKey',
  });
  const awardsArray = useFieldArray<
    ProfileUpdateFormValues,
    'awards',
    'fieldKey'
  >({
    control: form.control,
    name: 'awards',
    keyName: 'fieldKey',
  });

  const formValues = form.watch();
  const { isSubmitting, isDirty, errors } = form.formState;

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const appendExperience = () => {
    experienceArray.append({
      id: generateId(),
      role: '',
      company: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    });
  };

  const appendEducation = () => {
    educationArray.append({
      id: generateId(),
      degree: '',
      school: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    });
  };

  const appendProject = () => {
    projectsArray.append({
      id: generateId(),
      title: '',
      year: '',
      company: '',
      link: '',
      description: '',
    });
  };
  const appendCertification = () => {
    certificationsArray.append({
      id: generateId(),
      name: '',
      issuer: '',
      year: '',
      credentialId: '',
      link: '',
      description: '',
    });
  };
  const appendVolunteering = () => {
    volunteeringArray.append({
      id: generateId(),
      role: '',
      organization: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    });
  };
  const appendExhibition = () => {
    exhibitionsArray.append({
      id: generateId(),
      title: '',
      venue: '',
      year: '',
      location: '',
      link: '',
      description: '',
    });
  };
  const appendAward = () => {
    awardsArray.append({
      id: generateId(),
      title: '',
      issuer: '',
      year: '',
      link: '',
      description: '',
    });
  };

  const removeExperience = (index: number) => {
    experienceArray.remove(index);
  };

  const removeEducation = (index: number) => {
    educationArray.remove(index);
  };

  const removeProject = (index: number) => {
    projectsArray.remove(index);
  };
  const removeCertification = (index: number) => {
    certificationsArray.remove(index);
  };
  const removeVolunteering = (index: number) => {
    volunteeringArray.remove(index);
  };
  const removeExhibition = (index: number) => {
    exhibitionsArray.remove(index);
  };
  const removeAward = (index: number) => {
    awardsArray.remove(index);
  };

  const skills = formValues.skills ?? [];

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    const exists = skills.some(
      (skill) => skill.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      toast.info('Skill already added');
      return;
    }
    form.setValue('skills', [...skills, trimmed], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    form.setValue(
      'skills',
      skills.filter((value) => value !== skill),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  const isBlankExperience = (entry: ExperienceEntry): boolean => {
    const hasText =
      entry.role.trim() ||
      entry.company.trim() ||
      (entry.description?.trim() ?? '');
    const hasDates =
      (entry.startDate?.trim() ?? '') || (entry.endDate?.trim() ?? '');
    return !hasText && !hasDates && !entry.current;
  };

  const isBlankEducation = (entry: EducationEntry): boolean => {
    const hasText =
      entry.degree.trim() ||
      entry.school.trim() ||
      (entry.description?.trim() ?? '');
    const hasDates =
      (entry.startDate?.trim() ?? '') || (entry.endDate?.trim() ?? '');
    return !hasText && !hasDates && !entry.current;
  };

  const isBlankProject = (entry: ProjectEntry): boolean => {
    const hasText =
      entry.title.trim() ||
      (entry.company?.trim() ?? '') ||
      (entry.description?.trim() ?? '') ||
      (entry.link?.trim() ?? '');
    const hasYear = entry.year?.trim() ?? '';
    return !hasText && !hasYear;
  };
  const isBlankCertification = (entry: CertificationEntry): boolean => {
    const hasText =
      entry.name.trim() ||
      entry.issuer.trim() ||
      (entry.credentialId?.trim() ?? '') ||
      (entry.description?.trim() ?? '') ||
      (entry.link?.trim() ?? '');
    const hasYear = entry.year?.trim() ?? '';
    return !hasText && !hasYear;
  };
  const isBlankVolunteering = (entry: VolunteeringEntry): boolean => {
    const hasText =
      entry.role.trim() ||
      entry.organization.trim() ||
      (entry.description?.trim() ?? '');
    const hasDates =
      (entry.startDate?.trim() ?? '') || (entry.endDate?.trim() ?? '');
    return !hasText && !hasDates && !entry.current;
  };
  const isBlankExhibition = (entry: ExhibitionEntry): boolean => {
    const hasText =
      entry.title.trim() ||
      (entry.venue?.trim() ?? '') ||
      (entry.location?.trim() ?? '') ||
      (entry.description?.trim() ?? '') ||
      (entry.link?.trim() ?? '');
    const hasYear = entry.year?.trim() ?? '';
    return !hasText && !hasYear;
  };
  const isBlankAward = (entry: AwardEntry): boolean => {
    const hasText =
      entry.title.trim() ||
      entry.issuer.trim() ||
      (entry.description?.trim() ?? '') ||
      (entry.link?.trim() ?? '');
    const hasYear = entry.year?.trim() ?? '';
    return !hasText && !hasYear;
  };

  const onValid = async (values: ProfileUpdateFormValues) => {
    const payload = toMutationPayload(values);
    try {
      await updateProfile(payload);
      toast.success('Profile updated successfully!');
      form.reset(fromMutationPayload(payload));
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    }
  };

  const onInvalid = (invalidErrors: FieldErrors<ProfileUpdateFormValues>) => {
    toast.error('Please fix the highlighted fields');
    if (invalidErrors.experience) {
      setActiveSection('experience');
    } else if (invalidErrors.education) {
      setActiveSection('education');
    } else if (invalidErrors.skills) {
      setActiveSection('skills');
    } else {
      setActiveSection('header');
    }
    if (typeof window !== 'undefined' && document) {
      requestAnimationFrame(() => {
        const el = document.querySelector('[aria-invalid="true"]');
        if (el instanceof HTMLElement) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  };

  const submitForm = form.handleSubmit(onValid, onInvalid);

  const handlePreSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = form.getValues();
    const cleanedExperience = values.experience.filter(
      (e) => !isBlankExperience(e)
    );
    const cleanedEducation = values.education.filter(
      (e) => !isBlankEducation(e)
    );
    const cleanedProjects = values.projects.filter((e) => !isBlankProject(e));
    const cleanedCertifications = values.certifications.filter(
      (e) => !isBlankCertification(e)
    );
    const cleanedVolunteering = values.volunteering.filter(
      (e) => !isBlankVolunteering(e)
    );
    const cleanedExhibitions = values.exhibitions.filter(
      (e) => !isBlankExhibition(e)
    );
    const cleanedAwards = values.awards.filter((e) => !isBlankAward(e));
    if (cleanedExperience.length !== values.experience.length) {
      experienceArray.replace(cleanedExperience);
    }
    if (cleanedEducation.length !== values.education.length) {
      educationArray.replace(cleanedEducation);
    }
    if (cleanedProjects.length !== values.projects.length) {
      projectsArray.replace(cleanedProjects);
    }
    if (cleanedCertifications.length !== values.certifications.length) {
      certificationsArray.replace(cleanedCertifications);
    }
    if (cleanedVolunteering.length !== values.volunteering.length) {
      volunteeringArray.replace(cleanedVolunteering);
    }
    if (cleanedExhibitions.length !== values.exhibitions.length) {
      exhibitionsArray.replace(cleanedExhibitions);
    }
    if (cleanedAwards.length !== values.awards.length) {
      awardsArray.replace(cleanedAwards);
    }
    void submitForm();
  };

  const previewProfile: ProfileContent = {
    ...profile,
    ...formValues,
    title: optionalField(formValues.title) ?? undefined,
    location: optionalField(formValues.location) ?? undefined,
    bio: optionalField(formValues.bio) ?? undefined,
    email: optionalField(formValues.email) ?? undefined,
    website: optionalField(formValues.website) ?? undefined,
    github: optionalField(formValues.github) ?? undefined,
    linkedin: optionalField(formValues.linkedin) ?? undefined,
    twitter: optionalField(formValues.twitter) ?? undefined,
    experience: formValues.experience,
    education: formValues.education,
    skills,
    projects: formValues.projects,
    certifications: formValues.certifications,
    volunteering: formValues.volunteering,
    exhibitions: formValues.exhibitions,
    awards: formValues.awards,
    sectionsOrder: formValues.sectionsOrder,
  };

  const sectionLabels: Record<SectionId, string> = {
    header: 'General',
    bio: 'About',
    contact: 'Contact',
    experience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications',
    volunteering: 'Volunteering',
    exhibitions: 'Exhibitions',
    awards: 'Awards',
  };

  const sensors = useSensors(useSensor(PointerSensor));

  const currentOrder: Array<SectionId> = useMemo(
    () => resolveSectionsOrder(formValues.sectionsOrder),
    [formValues.sectionsOrder]
  );

  const draggableSections: Array<SectionId> = useMemo(
    () =>
      currentOrder.filter(
        (s) =>
          s === 'experience' ||
          s === 'education' ||
          s === 'skills' ||
          s === 'projects' ||
          s === 'certifications' ||
          s === 'volunteering' ||
          s === 'exhibitions' ||
          s === 'awards'
      ),
    [currentOrder]
  );
  const navIds = draggableSections.map((id) => `nav:${id}`);

  function SortableNavItem({
    id,
    section,
    selected,
    onSelect,
  }: {
    id: string;
    section: SectionId;
    selected: boolean;
    onSelect: () => void;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition: isDragging ? undefined : transition,
    };
    return (
      <div ref={setNodeRef} style={style} className="select-none">
        <button
          type="button"
          onClick={onSelect}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-left ${
            selected
              ? 'bg-secondary text-secondary-foreground'
              : 'text-foreground hover:bg-muted'
          }`}
        >
          <span className="text-sm">{sectionLabels[section]}</span>
          <span
            className="text-muted-foreground cursor-grab"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </span>
        </button>
      </div>
    );
  }

  function NavItem({
    section,
    selected,
    onSelect,
  }: {
    section: SectionId;
    selected: boolean;
    onSelect: () => void;
  }) {
    return (
      <div className="select-none">
        <button
          type="button"
          onClick={onSelect}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-left ${
            selected
              ? 'bg-secondary text-secondary-foreground'
              : 'text-foreground hover:bg-muted'
          }`}
        >
          <span className="text-sm">{sectionLabels[section]}</span>
        </button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={handlePreSubmit} className="flex min-h-screen">
        <div className="w-full lg:w-1/2 border-r overflow-y-auto bg-card">
          <div className="p-6 md:p-8 space-y-6">
            <div className="relative z-10 flex justify-between items-center pb-4 border-b">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium text-foreground">
                  {profile.name || 'Your CV'}
                </h2>
                <span
                  className={`inline-flex h-2 w-2 rounded-full ${
                    isDirty ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  title={isDirty ? 'Unsaved changes' : 'Saved'}
                />
              </div>
              <div className="flex items-center gap-3">
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(Boolean(checked))
                          }
                        />
                      </FormControl>
                      <FormLabel className="text-sm text-muted-foreground font-normal">
                        Public
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !isDirty}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
                {profile.username && (
                  <a
                    href={`/api/pdf?username=${encodeURIComponent(profile.username)}`}
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/30"
                  >
                    <Download className="h-3 w-3" />
                    PDF
                  </a>
                )}
                {profile.isPublic && profile.username && (
                  <a
                    href={`/@${profile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/30"
                  >
                    View Profile
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {formValues.isPublic && (
              <div className="p-4 bg-secondary border rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your profile is public at:{' '}
                  <a
                    href={`/@${profile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline text-primary hover:text-primary/80"
                  >
                    /@{profile.username}
                  </a>
                </p>
                <p className="text-xs text-muted-foreground">
                  This URL is server-rendered for fast loading and optimal SEO.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
              <div>
                {/* Pinned General section */}
                <NavItem
                  section="header"
                  selected={activeSection === 'header'}
                  onSelect={() => setActiveSection('header')}
                />
                {/* Draggable sections */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={({ active, over }) => {
                    if (!over) return;
                    const oldIndex = navIds.indexOf(String(active.id));
                    const newIndex = navIds.indexOf(String(over.id));
                    if (oldIndex === -1 || newIndex === -1) return;
                    const nextDraggable = arrayMove(
                      draggableSections,
                      oldIndex,
                      newIndex
                    );
                    const next: Array<SectionId> = ['header', ...nextDraggable];
                    form.setValue('sectionsOrder', next, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                >
                  <SortableContext
                    items={navIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4 pt-4">
                      {draggableSections.map((section) => (
                        <SortableNavItem
                          key={`nav:${section}`}
                          id={`nav:${section}`}
                          section={section}
                          selected={activeSection === section}
                          onSelect={() => setActiveSection(section)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
              <div>
                {activeSection === 'header' && <SectionGeneral form={form} />}
                {activeSection === 'experience' && (
                  <>
                    {experienceArray.fields.length === 0 && (
                      <EmptySection
                        hint="Add your work history to showcase your professional background."
                        onAdd={appendExperience}
                        label="Add Experience"
                      />
                    )}
                    <SectionExperience
                      form={form}
                      fields={experienceArray.fields}
                      onAdd={appendExperience}
                      onRemove={removeExperience}
                      onMove={(oldIndex, newIndex) =>
                        experienceArray.move(oldIndex, newIndex)
                      }
                    />
                  </>
                )}
                {activeSection === 'education' && (
                  <>
                    {educationArray.fields.length === 0 && (
                      <EmptySection
                        hint="Add your educational background -- degrees, bootcamps, or courses."
                        onAdd={appendEducation}
                        label="Add Education"
                      />
                    )}
                    <SectionEducation
                      form={form}
                      fields={educationArray.fields}
                      onAdd={appendEducation}
                      onRemove={removeEducation}
                      onMove={(oldIndex, newIndex) =>
                        educationArray.move(oldIndex, newIndex)
                      }
                    />
                  </>
                )}
                {activeSection === 'skills' && (
                  <SectionSkills
                    form={form}
                    skills={skills}
                    newSkill={newSkill}
                    onChangeNew={setNewSkill}
                    onAdd={addSkill}
                    onRemove={removeSkill}
                    error={errors.skills?.message}
                  />
                )}
                {activeSection === 'projects' && (
                  <>
                    {projectsArray.fields.length === 0 && (
                      <EmptySection
                        hint="Highlight side projects, open-source work, or anything you've built."
                        onAdd={appendProject}
                        label="Add Project"
                      />
                    )}
                    <SectionProjects
                      form={form}
                      fields={projectsArray.fields}
                      onAdd={appendProject}
                      onRemove={removeProject}
                      onMove={(oldIndex, newIndex) =>
                        projectsArray.move(oldIndex, newIndex)
                      }
                    />
                  </>
                )}
                {activeSection === 'certifications' && (
                  <>
                    {certificationsArray.fields.length === 0 && (
                      <EmptySection
                        hint="List professional certifications, licenses, or credentials."
                        onAdd={appendCertification}
                        label="Add Certification"
                      />
                    )}
                    <SectionCertifications
                      form={form}
                      fields={certificationsArray.fields}
                      onAdd={appendCertification}
                      onRemove={removeCertification}
                      onMove={(oldIndex, newIndex) =>
                        certificationsArray.move(oldIndex, newIndex)
                      }
                    />
                  </>
                )}
                {activeSection === 'volunteering' && (
                  <>
                    {volunteeringArray.fields.length === 0 && (
                      <EmptySection
                        hint="Share volunteer work, mentoring, or community involvement."
                        onAdd={appendVolunteering}
                        label="Add Volunteering"
                      />
                    )}
                    <SectionVolunteering
                      form={form}
                      fields={volunteeringArray.fields}
                      onAdd={appendVolunteering}
                      onRemove={removeVolunteering}
                      onMove={(oldIndex, newIndex) =>
                        volunteeringArray.move(oldIndex, newIndex)
                      }
                    />
                  </>
                )}
                {activeSection === 'exhibitions' && (
                  <>
                    {exhibitionsArray.fields.length === 0 && (
                      <EmptySection
                        hint="Showcase exhibitions, gallery shows, or public presentations of your work."
                        onAdd={appendExhibition}
                        label="Add Exhibition"
                      />
                    )}
                    <SectionExhibitions
                      form={form}
                      fields={exhibitionsArray.fields}
                      onAdd={appendExhibition}
                      onRemove={removeExhibition}
                      onMove={(oldIndex, newIndex) =>
                        exhibitionsArray.move(oldIndex, newIndex)
                      }
                    />
                  </>
                )}
                {activeSection === 'awards' && (
                  <>
                    {awardsArray.fields.length === 0 && (
                      <EmptySection
                        hint="Add honors, awards, or recognition you've received."
                        onAdd={appendAward}
                        label="Add Award"
                      />
                    )}
                    <SectionAwards
                      form={form}
                      fields={awardsArray.fields}
                      onAdd={appendAward}
                      onRemove={removeAward}
                      onMove={(oldIndex, newIndex) =>
                        awardsArray.move(oldIndex, newIndex)
                      }
                    />
                  </>
                )}
              </div>
            </div>
            {/* Legacy tab blocks removed */}
          </div>
        </div>

        <div className="hidden lg:block w-1/2 bg-muted/30 overflow-y-auto">
          <div className="p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                Live Preview
              </h3>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <PreviewPane
                profile={previewProfile}
                sectionsOrder={formValues.sectionsOrder}
                onReorderExperience={(next) => {
                  const normalized = next.map((entry) =>
                    normalizeExperienceForForm(entry)
                  );
                  form.setValue('experience', normalized, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  experienceArray.replace(normalized);
                }}
                onReorderEducation={(next) => {
                  const normalized = next.map((entry) =>
                    normalizeEducationForForm(entry)
                  );
                  form.setValue('education', normalized, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  educationArray.replace(normalized);
                }}
                onReorderSkills={(next) => {
                  form.setValue('skills', next, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
