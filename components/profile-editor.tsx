'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { Download, ExternalLink, GitBranch } from 'lucide-react';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';

import {
  createInitialSectionsVisibility,
  getSectionForInvalidRoot,
  INITIAL_ACTIVE_SECTION,
} from '@/components/editor/profile-editor-config';
import { ProfileEditorNavigation } from '@/components/editor/profile-editor-navigation';
import { ProfileEditorPreview } from '@/components/editor/profile-editor-preview';
import { ProfileEditorSection } from '@/components/editor/profile-editor-section';
import { useProfileFieldArrays } from '@/components/editor/hooks/use-profile-field-arrays';
import { useUnsavedChangesWarning } from '@/components/editor/hooks/use-unsaved-changes-warning';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { VersionManager } from '@/components/versions/version-manager';
import { api } from '@/convex/_generated/api';
import {
  DEFAULT_SECTIONS_ORDER,
  type SectionId,
  type SectionsVisibility,
} from '@/lib/profile/domain';
import {
  fromMutationPayload,
  isBlankAward,
  isBlankCertification,
  isBlankEducation,
  isBlankExhibition,
  isBlankExperience,
  isBlankProject,
  isBlankVolunteering,
  resolveSectionsOrder,
  toFormValues,
  toMutationPayload,
  type ProfileUpdateFormValues,
} from '@/lib/profile/editor';
import { createProfileUpdateFormSchema } from '@/lib/profile/editor-schema';
import type { ProfileEditorProps } from '@/lib/types';

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const defaultValues = useMemo(() => toFormValues(profile), [profile]);
  const form = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(createProfileUpdateFormSchema(profile)),
    defaultValues,
    mode: 'onSubmit',
  });

  useEffect(() => {
    form.reset(toFormValues(profile));
  }, [profile, form]);

  const updateProfile = useMutation(api.profiles.updateProfile);
  const [activeSection, setActiveSection] = useState<SectionId>(
    INITIAL_ACTIVE_SECTION
  );
  const [versionManagerOpen, setVersionManagerOpen] = useState(false);
  const [sectionsVisibility, setSectionsVisibility] =
    useState<SectionsVisibility>(createInitialSectionsVisibility);
  const fieldArrays = useProfileFieldArrays(form.control, generateId);

  const isPublic = useWatch({ control: form.control, name: 'isPublic' });
  const sectionsOrder = useWatch({
    control: form.control,
    name: 'sectionsOrder',
  });
  const { isSubmitting, isDirty } = form.formState;
  useUnsavedChangesWarning(isDirty);

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
    setActiveSection(getSectionForInvalidRoot(invalidErrors));
    if (typeof window !== 'undefined' && document) {
      requestAnimationFrame(() => {
        const element = document.querySelector('[aria-invalid="true"]');
        if (element instanceof HTMLElement) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  };

  const submitForm = form.handleSubmit(onValid, onInvalid);
  const handlePreSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = form.getValues();
    const cleanedExperience = values.experience.filter(
      (entry) => !isBlankExperience(entry)
    );
    const cleanedEducation = values.education.filter(
      (entry) => !isBlankEducation(entry)
    );
    const cleanedProjects = values.projects.filter(
      (entry) => !isBlankProject(entry)
    );
    const cleanedCertifications = values.certifications.filter(
      (entry) => !isBlankCertification(entry)
    );
    const cleanedVolunteering = values.volunteering.filter(
      (entry) => !isBlankVolunteering(entry)
    );
    const cleanedExhibitions = values.exhibitions.filter(
      (entry) => !isBlankExhibition(entry)
    );
    const cleanedAwards = values.awards.filter((entry) => !isBlankAward(entry));

    if (cleanedExperience.length !== values.experience.length) {
      fieldArrays.experience.replace(cleanedExperience);
    }
    if (cleanedEducation.length !== values.education.length) {
      fieldArrays.education.replace(cleanedEducation);
    }
    if (cleanedProjects.length !== values.projects.length) {
      fieldArrays.projects.replace(cleanedProjects);
    }
    if (cleanedCertifications.length !== values.certifications.length) {
      fieldArrays.certifications.replace(cleanedCertifications);
    }
    if (cleanedVolunteering.length !== values.volunteering.length) {
      fieldArrays.volunteering.replace(cleanedVolunteering);
    }
    if (cleanedExhibitions.length !== values.exhibitions.length) {
      fieldArrays.exhibitions.replace(cleanedExhibitions);
    }
    if (cleanedAwards.length !== values.awards.length) {
      fieldArrays.awards.replace(cleanedAwards);
    }
    void submitForm();
  };

  const currentOrder = useMemo(
    () => resolveSectionsOrder(sectionsOrder),
    [sectionsOrder]
  );
  const handleSectionsReorder = useCallback(
    (order: SectionId[]) => {
      form.setValue('sectionsOrder', order, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form]
  );

  return (
    <Form {...form}>
      <form
        onSubmit={handlePreSubmit}
        className="flex h-screen overflow-hidden"
      >
        <div className="w-full lg:w-1/2 border-r overflow-y-auto scrollbar-hide bg-card">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVersionManagerOpen(true)}
                >
                  <GitBranch className="h-3 w-3 mr-1" />
                  Versions
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

            {isPublic && (
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
              <ProfileEditorNavigation
                order={currentOrder}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                onReorder={handleSectionsReorder}
              />
              <div>
                <ProfileEditorSection
                  activeSection={activeSection}
                  form={form}
                  fieldArrays={fieldArrays}
                />
              </div>
            </div>
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
              <ProfileEditorPreview
                form={form}
                profile={profile}
                sectionsVisibility={sectionsVisibility}
              />
            </div>
          </div>
        </div>
        <VersionManager
          open={versionManagerOpen}
          onOpenChange={setVersionManagerOpen}
          currentSectionsOrder={sectionsOrder ?? DEFAULT_SECTIONS_ORDER}
          currentSectionsVisibility={sectionsVisibility}
          onSectionsVisibilityChange={setSectionsVisibility}
          onLoadVersion={(version) => {
            if (version.sectionsOrder) {
              form.setValue(
                'sectionsOrder',
                resolveSectionsOrder(version.sectionsOrder),
                {
                  shouldDirty: true,
                }
              );
            }
            setSectionsVisibility(version.sectionsVisibility);
            toast.success('Version loaded');
          }}
        />
      </form>
    </Form>
  );
}
