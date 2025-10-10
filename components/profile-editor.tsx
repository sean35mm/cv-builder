import { forwardRef, useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ProfilePreview } from "./profile-preview";
import {
  DEFAULT_SECTIONS_ORDER,
  SECTION_IDS,
  type EducationEntry,
  type ExperienceEntry,
  type MonthInputProps,
  type ProfileContent,
  type ProfileEditorProps,
  type ProfileUpdateFormValues,
  type ProfileUpdateInput,
  type SectionId,
  type TabId,
} from "@/lib/types";

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

const monthStringSchema = z
  .string()
  .min(1, "Select a month")
  .regex(monthRegex, "Select a valid month (YYYY-MM)");

const optionalMonthStringSchema = z
  .string()
  .refine((value) => value === "" || monthRegex.test(value), {
    message: "Select a valid month (YYYY-MM)",
  })
  .optional();

const experienceEntrySchema: z.ZodType<ExperienceEntry> = z
  .object({
    id: z.string().min(1, "Identifier missing"),
    role: z.string().trim().min(1, "Role is required").max(120),
    company: z.string().trim().min(1, "Company is required").max(120),
    startDate: monthStringSchema,
    endDate: optionalMonthStringSchema,
    current: z.boolean(),
    description: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.current) {
      if (value.endDate && value.endDate !== "") {
        ctx.addIssue({
          code: "custom",
          message: "Clear end date when marked as current",
          path: ["endDate"],
        });
      }
      return;
    }

    const endDate = value.endDate ?? "";
    if (!endDate) {
      ctx.addIssue({
        code: "custom",
        message: "End date required unless current",
        path: ["endDate"],
      });
      return;
    }

    if (endDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "End date cannot be before start date",
        path: ["endDate"],
      });
    }
  });

const educationEntrySchema: z.ZodType<EducationEntry> = z
  .object({
    id: z.string().min(1, "Identifier missing"),
    degree: z.string().trim().min(1, "Degree is required").max(120),
    school: z.string().trim().min(1, "School is required").max(120),
    startDate: monthStringSchema,
    endDate: optionalMonthStringSchema,
    current: z.boolean(),
    description: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.current) {
      if (value.endDate && value.endDate !== "") {
        ctx.addIssue({
          code: "custom",
          message: "Clear end date when currently studying",
          path: ["endDate"],
        });
      }
      return;
    }

    const endDate = value.endDate ?? "";
    if (!endDate) {
      ctx.addIssue({
        code: "custom",
        message: "End date required unless currently studying",
        path: ["endDate"],
      });
      return;
    }

    if (endDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "End date cannot be before start date",
        path: ["endDate"],
      });
    }
  });

const skillSchema = z.string().trim().min(1, "Skill cannot be empty").max(50);

const profileUpdateFormSchema: z.ZodType<ProfileUpdateFormValues> = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    title: z.string().trim().max(120).optional(),
    location: z.string().trim().max(120).optional(),
    bio: z.string().trim().max(2000).optional(),
    email: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        {
          message: "Enter a valid email",
        },
      )
      .optional(),
    website: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          /^https?:\/\//i.test(value) ||
          /^[\w.-]+\.[A-Za-z]{2,}(\/.*)?$/.test(value),
        {
          message: "Enter a valid URL",
        },
      )
      .optional(),
    github: z.string().trim().max(120).optional(),
    linkedin: z.string().trim().max(120).optional(),
    twitter: z.string().trim().max(120).optional(),
    experience: z.array(experienceEntrySchema),
    education: z.array(educationEntrySchema),
    skills: z
      .array(skillSchema)
      .max(50, "Keep skills list under 50 entries")
      .superRefine((skills, ctx) => {
        const normalized = skills.map((skill) => skill.toLowerCase());
        if (new Set(normalized).size !== normalized.length) {
          ctx.addIssue({
            code: "custom",
            message: "Skills must be unique",
          });
        }
      }),
    sectionsOrder: z
      .array(z.enum(SECTION_IDS))
      .refine(
        (arr) => new Set(arr).size === arr.length,
        "Sections must be unique",
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
          code: "custom",
          message: "Unknown section",
          path: ["sectionsOrder"],
        });
        break;
      }
    }
  });

const MonthInput = forwardRef<HTMLButtonElement, MonthInputProps>(
  ({ value, onChange, disabled, placeholder = "Select month" }, ref) => {
    const parse = (input: string | undefined): Date | undefined => {
      if (!input) return undefined;
      const [year, month] = input.split("-");
      const parsedYear = Number(year);
      const parsedMonth = Number(month);
      if (!parsedYear || !parsedMonth) return undefined;
      return new Date(parsedYear, parsedMonth - 1, 1);
    };

    const toYmm = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${year}-${month}`;
    };

    const label = (input: string | undefined): string => {
      const parsed = parse(input);
      if (!parsed) return placeholder;
      return parsed.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
    };

    const selected = parse(value);

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            disabled={disabled}
            type="button"
            className="justify-start w-full"
          >
            {label(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0">
          <div className="p-2">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(date) => {
                if (date) {
                  onChange(toYmm(date));
                }
              }}
              captionLayout="dropdown"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onChange("")}
              >
                Clear
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

MonthInput.displayName = "MonthInput";

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const optionalField = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const isSectionId = (value: string): value is SectionId =>
  SECTION_IDS.includes(value as SectionId);

const resolveSectionsOrder = (
  order?: ReadonlyArray<string>,
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
  entry: ExperienceEntry,
): ExperienceEntry => ({
  ...entry,
  endDate: entry.endDate ?? "",
  description: entry.description ?? "",
});

const normalizeEducationForForm = (entry: EducationEntry): EducationEntry => ({
  ...entry,
  endDate: entry.endDate ?? "",
  description: entry.description ?? "",
});

const toFormValues = (profile: Doc<"profiles">): ProfileUpdateFormValues => ({
  name: profile.name,
  title: profile.title ?? "",
  location: profile.location ?? "",
  bio: profile.bio ?? "",
  email: profile.email ?? "",
  website: profile.website ?? "",
  github: profile.github ?? "",
  linkedin: profile.linkedin ?? "",
  twitter: profile.twitter ?? "",
  experience: profile.experience.map((entry) =>
    normalizeExperienceForForm({
      id: entry.id,
      role: entry.role,
      company: entry.company,
      startDate: entry.startDate,
      endDate: entry.endDate ?? "",
      current: entry.current,
      description: entry.description ?? "",
    }),
  ),
  education: profile.education.map((entry) =>
    normalizeEducationForForm({
      id: entry.id,
      degree: entry.degree,
      school: entry.school,
      startDate: entry.startDate,
      endDate: entry.endDate ?? "",
      current: entry.current,
      description: entry.description ?? "",
    }),
  ),
  skills: profile.skills,
  sectionsOrder: resolveSectionsOrder(profile.sectionsOrder),
  isPublic: profile.isPublic,
});

const toMutationPayload = (
  values: ProfileUpdateFormValues,
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
      entry.current || !entry.endDate || entry.endDate.trim() === ""
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
      entry.current || !entry.endDate || entry.endDate.trim() === ""
        ? undefined
        : entry.endDate,
    current: entry.current,
    description: optionalField(entry.description),
  })),
  skills: Array.from(
    new Set(
      values.skills
        .map((skill) => skill.trim())
        .filter((skill) => skill !== ""),
    ),
  ),
  sectionsOrder: values.sectionsOrder
    ? resolveSectionsOrder(values.sectionsOrder)
    : resolveSectionsOrder(),
  isPublic: values.isPublic,
});

const fromMutationPayload = (
  payload: ProfileUpdateInput,
): ProfileUpdateFormValues => ({
  name: payload.name,
  title: payload.title ?? "",
  location: payload.location ?? "",
  bio: payload.bio ?? "",
  email: payload.email ?? "",
  website: payload.website ?? "",
  github: payload.github ?? "",
  linkedin: payload.linkedin ?? "",
  twitter: payload.twitter ?? "",
  experience: payload.experience.map((entry) =>
    normalizeExperienceForForm({
      id: entry.id,
      role: entry.role,
      company: entry.company,
      startDate: entry.startDate,
      endDate: entry.endDate ?? "",
      current: entry.current,
      description: entry.description ?? "",
    }),
  ),
  education: payload.education.map((entry) =>
    normalizeEducationForForm({
      id: entry.id,
      degree: entry.degree,
      school: entry.school,
      startDate: entry.startDate,
      endDate: entry.endDate ?? "",
      current: entry.current,
      description: entry.description ?? "",
    }),
  ),
  skills: payload.skills,
  sectionsOrder: resolveSectionsOrder(payload.sectionsOrder),
  isPublic: payload.isPublic,
});

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const defaultValues = useMemo(() => toFormValues(profile), [profile]);
  const form = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(
      profileUpdateFormSchema,
    ) as Resolver<ProfileUpdateFormValues>,
    defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    form.reset(toFormValues(profile));
  }, [profile, form]);

  const updateProfile = useMutation(api.profiles.updateProfile);

  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [newSkill, setNewSkill] = useState("");

  const experienceArray = useFieldArray<
    ProfileUpdateFormValues,
    "experience",
    "fieldKey"
  >({
    control: form.control,
    name: "experience",
    keyName: "fieldKey",
  });
  const educationArray = useFieldArray<
    ProfileUpdateFormValues,
    "education",
    "fieldKey"
  >({
    control: form.control,
    name: "education",
    keyName: "fieldKey",
  });

  const formValues = form.watch();
  const { isDirty, isSubmitting, errors } = form.formState;

  const appendExperience = () => {
    experienceArray.append({
      id: generateId(),
      role: "",
      company: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    });
  };

  const appendEducation = () => {
    educationArray.append({
      id: generateId(),
      degree: "",
      school: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    });
  };

  const removeExperience = (index: number) => {
    experienceArray.remove(index);
  };

  const removeEducation = (index: number) => {
    educationArray.remove(index);
  };

  const skills = formValues.skills ?? [];

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    const exists = skills.some(
      (skill) => skill.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      toast.info("Skill already added");
      return;
    }
    form.setValue("skills", [...skills, trimmed], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    form.setValue(
      "skills",
      skills.filter((value) => value !== skill),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  const submitForm = form.handleSubmit(async (values) => {
    const payload = toMutationPayload(values);
    try {
      await updateProfile(payload);
      toast.success("Profile updated successfully!");
      form.reset(fromMutationPayload(payload));
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    }
  });

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
    sectionsOrder: formValues.sectionsOrder,
  };

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "basic", label: "Basic Info" },
    { id: "experience", label: "Experience" },
    { id: "education", label: "Education" },
    { id: "skills", label: "Skills" },
  ];

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          void submitForm(event);
        }}
        className="flex min-h-screen"
      >
        <div className="w-1/2 border-r border overflow-y-auto bg-card">
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">
                Edit Profile
              </h2>
              <div className="flex items-center gap-4">
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
                <Button type="submit" disabled={!isDirty || isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>

            {formValues.isPublic && (
              <div className="p-4 bg-secondary border rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your profile is public at:{" "}
                  <a
                    href={`/@${profile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline text-primary hover:text-primary"
                  >
                    /@{profile.username}
                  </a>
                </p>
                <p className="text-xs text-muted-foreground">
                  This URL is server-rendered for fast loading and optimal SEO.
                </p>
              </div>
            )}

            <div className="flex border-b border">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  type="button"
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-none border-b-2 ${
                    activeTab === tab.id
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {activeTab === "basic" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="github"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {activeTab === "experience" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-foreground">
                    Experience
                  </h3>
                  <Button type="button" onClick={appendExperience}>
                    Add Experience
                  </Button>
                </div>
                {experienceArray.fields.map((field, index) => {
                  const current = form.watch(`experience.${index}.current`);
                  return (
                    <div
                      key={field.fieldKey}
                      className="rounded-xl p-5 bg-card space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-foreground">
                          Experience Entry
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 text-sm"
                          onClick={() => removeExperience(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`experience.${index}.role`}
                          render={({ field: roleField }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormControl>
                                <Input {...roleField} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`experience.${index}.company`}
                          render={({ field: companyField }) => (
                            <FormItem>
                              <FormLabel>Company</FormLabel>
                              <FormControl>
                                <Input {...companyField} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`experience.${index}.startDate`}
                          render={({ field: startField }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <MonthInput
                                  value={startField.value}
                                  onChange={startField.onChange}
                                  disabled={startField.disabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`experience.${index}.endDate`}
                          render={({ field: endField }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <MonthInput
                                  value={endField.value}
                                  onChange={endField.onChange}
                                  disabled={current}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`experience.${index}.current`}
                        render={({ field: currentField }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={currentField.value}
                                onCheckedChange={(checked) =>
                                  currentField.onChange(Boolean(checked))
                                }
                              />
                            </FormControl>
                            <FormLabel className="text-sm text-muted-foreground font-normal">
                              Current position
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`experience.${index}.description`}
                        render={({ field: descriptionField }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea rows={3} {...descriptionField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "education" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-foreground">
                    Education
                  </h3>
                  <Button type="button" onClick={appendEducation}>
                    Add Education
                  </Button>
                </div>
                {educationArray.fields.map((field, index) => {
                  const current = form.watch(`education.${index}.current`);
                  return (
                    <div
                      key={field.fieldKey}
                      className="rounded-xl p-5 bg-card space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-foreground">
                          Education Entry
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 text-sm"
                          onClick={() => removeEducation(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`education.${index}.degree`}
                          render={({ field: degreeField }) => (
                            <FormItem>
                              <FormLabel>Degree</FormLabel>
                              <FormControl>
                                <Input {...degreeField} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`education.${index}.school`}
                          render={({ field: schoolField }) => (
                            <FormItem>
                              <FormLabel>School</FormLabel>
                              <FormControl>
                                <Input {...schoolField} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`education.${index}.startDate`}
                          render={({ field: startField }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <MonthInput
                                  value={startField.value}
                                  onChange={startField.onChange}
                                  disabled={startField.disabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`education.${index}.endDate`}
                          render={({ field: endField }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <MonthInput
                                  value={endField.value}
                                  onChange={endField.onChange}
                                  disabled={current}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`education.${index}.current`}
                        render={({ field: currentField }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={currentField.value}
                                onCheckedChange={(checked) =>
                                  currentField.onChange(Boolean(checked))
                                }
                              />
                            </FormControl>
                            <FormLabel className="text-sm text-muted-foreground font-normal">
                              Currently studying
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`education.${index}.description`}
                        render={({ field: descriptionField }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea rows={3} {...descriptionField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "skills" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    Skills
                  </h3>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="text"
                      value={newSkill}
                      onChange={(event) => setNewSkill(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="Add a skill..."
                    />
                    <Button type="button" onClick={addSkill}>
                      Add
                    </Button>
                  </div>
                  {errors.skills && (
                    <p className="text-destructive text-sm">
                      {errors.skills.message}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="px-3 py-1"
                      >
                        <span>{skill}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-2 text-muted-foreground hover:text-red-500"
                          onClick={() => removeSkill(skill)}
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-1/2 bg-background overflow-y-auto">
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">
                Live Preview
              </h3>
              {isDirty && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              )}
            </div>
            <ProfilePreview
              profile={previewProfile}
              sectionsOrder={formValues.sectionsOrder}
              onReorderSections={(next) => {
                const sanitized = resolveSectionsOrder(next);
                form.setValue("sectionsOrder", sanitized, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              onReorderExperience={(next) => {
                const normalized = next.map((entry) =>
                  normalizeExperienceForForm(entry),
                );
                form.setValue("experience", normalized, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                experienceArray.replace(normalized);
              }}
              onReorderEducation={(next) => {
                const normalized = next.map((entry) =>
                  normalizeEducationForForm(entry),
                );
                form.setValue("education", normalized, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                educationArray.replace(normalized);
              }}
              onReorderSkills={(next) => {
                form.setValue("skills", next, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              showDragHandles
            />
          </div>
        </div>
      </form>
    </Form>
  );
}
