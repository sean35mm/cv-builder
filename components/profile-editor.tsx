'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { Eye, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';

import {
  createInitialSectionsVisibility,
  getSectionForInvalidRoot,
  INITIAL_ACTIVE_SECTION,
  SECTION_LABELS,
} from '@/components/editor/profile-editor-config';
import { ProfileEditorNavigation } from '@/components/editor/profile-editor-navigation';
import { ProfileEditorPreview } from '@/components/editor/profile-editor-preview';
import { ProfileEditorSection } from '@/components/editor/profile-editor-section';
import { LinkedInImportDialog } from '@/components/editor/linkedin-import-dialog';
import { Phase5Tools } from '@/components/editor/phase5-tools';
import { useProfileFieldArrays } from '@/components/editor/hooks/use-profile-field-arrays';
import { useUnsavedChangesWarning } from '@/components/editor/hooks/use-unsaved-changes-warning';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
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
  isBlankLanguage,
  isBlankProject,
  isBlankPublication,
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
  const { isSubmitting, isDirty } = form.formState;

  // Re-seed the form from the server only when there are no pending local
  // edits. Unrelated profile-document updates (Advanced tools, locale
  // changes) would otherwise discard unsaved editor changes.
  useEffect(() => {
    if (isDirty) return;
    form.reset(toFormValues(profile));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, form]);

  const updateProfile = useMutation(api.profiles.updateProfile);
  const [activeSection, setActiveSection] = useState<SectionId>(
    INITIAL_ACTIVE_SECTION
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [versionManagerOpen, setVersionManagerOpen] = useState(false);
  const [sectionsVisibility, setSectionsVisibility] =
    useState<SectionsVisibility>(createInitialSectionsVisibility);
  const fieldArrays = useProfileFieldArrays(form.control, generateId);

  const sectionsOrder = useWatch({
    control: form.control,
    name: 'sectionsOrder',
  });
  useUnsavedChangesWarning(isDirty);

  const onValid = async (values: ProfileUpdateFormValues) => {
    const payload = toMutationPayload(values);
    try {
      await updateProfile(payload);
      toast.success('Profile saved');
      form.reset(fromMutationPayload(payload));
    } catch (error) {
      console.error(error);
      toast.error('Profile was not saved');
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
    const cleanedLanguages = values.languages.filter(
      (entry) => !isBlankLanguage(entry)
    );
    const cleanedPublications = values.publications.filter(
      (entry) => !isBlankPublication(entry)
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
    if (cleanedLanguages.length !== values.languages.length) {
      fieldArrays.languages.replace(cleanedLanguages);
    }
    if (cleanedPublications.length !== values.publications.length) {
      fieldArrays.publications.replace(cleanedPublications);
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
        className="min-h-screen bg-background xl:h-screen xl:overflow-hidden"
      >
        <header className="sticky top-14 z-30 flex min-h-[68px] items-center justify-between gap-4 border-b border-border bg-background px-4 py-3 sm:px-6 xl:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-lg font-semibold tracking-[-0.02em] text-foreground sm:text-xl">
                {profile.name || 'Your profile'}
              </h1>
              <Badge
                variant="outline"
                className="hidden sm:inline-flex"
                role="status"
                aria-live="polite"
              >
                {isSubmitting
                  ? 'Saving…'
                  : isDirty
                    ? 'Unsaved changes'
                    : 'Saved'}
              </Badge>
            </div>
            <p className="hidden text-xs text-muted-foreground md:block">
              Edit profile content and save your changes.
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye aria-hidden="true" />
              Preview
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1396px] xl:grid xl:h-[calc(100vh-7.75rem)] xl:grid-cols-[216px_minmax(560px,720px)_minmax(400px,460px)] xl:justify-center">
          <aside
            className="hidden border-r border-border bg-background p-3 xl:block"
            aria-label="Profile sections"
          >
            <div className="mb-3 border-b border-border p-4">
              <p className="text-sm font-semibold text-foreground">
                Your profile
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Drag sections to change the public reading order.
              </p>
            </div>
            <ProfileEditorNavigation
              order={currentOrder}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              onReorder={handleSectionsReorder}
            />
          </aside>

          <main className="min-w-0 xl:overflow-y-auto">
            <div className="space-y-5 px-3 py-4 pb-28 sm:px-6 sm:py-6 sm:pb-10 xl:px-4 xl:py-5">
              <div className="sticky top-[calc(3.5rem+68px)] z-20 -mx-3 border-b border-border bg-background px-3 py-2 sm:-mx-6 sm:px-6 xl:hidden">
                <ProfileEditorNavigation
                  order={currentOrder}
                  activeSection={activeSection}
                  setActiveSection={setActiveSection}
                  onReorder={handleSectionsReorder}
                />
              </div>

              <section
                className="border-y border-border py-5 sm:py-7"
                aria-labelledby="current-editor-section"
              >
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2
                      id="current-editor-section"
                      className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl"
                    >
                      {SECTION_LABELS[activeSection]}
                    </h2>
                  </div>
                  <p className="max-w-60 text-sm leading-5 text-muted-foreground">
                    Changes stay local until you save.
                  </p>
                </div>
                <ProfileEditorSection
                  activeSection={activeSection}
                  form={form}
                  fieldArrays={fieldArrays}
                />
              </section>

              <details className="rounded border border-border bg-card px-5">
                <summary className="flex min-h-14 cursor-pointer items-center py-3 font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Advanced tools, import, and versions
                </summary>
                <div className="pb-5">
                  <p className="mb-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Import data, restore a version, or manage advanced profile
                    settings.
                  </p>
                  <div className="mb-6 flex flex-wrap gap-2">
                    <LinkedInImportDialog form={form} />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setVersionManagerOpen(true)}
                    >
                      <GitBranch aria-hidden="true" />
                      Versions
                    </Button>
                  </div>
                  <Phase5Tools profile={profile} form={form} />
                </div>
              </details>
            </div>
          </main>

          <aside
            className="hidden min-w-0 border-l border-border bg-background p-5 xl:block"
            aria-label="Profile preview"
          >
            <div className="flex h-full min-h-0 flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-sm font-semibold text-foreground">
                    Live preview
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isDirty
                      ? 'Includes your unsaved changes.'
                      : 'Showing your saved profile fields.'}
                  </p>
                </div>
                <Link
                  href="/appearance"
                  className="inline-flex min-h-11 items-center rounded border border-border px-3 text-xs font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Style
                </Link>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden rounded bg-secondary/40 p-3">
                <ProfileEditorPreview
                  form={form}
                  profile={profile}
                  sectionsVisibility={sectionsVisibility}
                />
              </div>
            </div>
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-[4.75rem] z-30 flex items-center gap-2 border-t border-border bg-background p-2 sm:hidden">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye aria-hidden="true" />
            Preview
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || !isDirty}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </div>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent
            className="inset-x-0 bottom-0 top-auto h-[94dvh] max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-t-lg border border-border p-0 sm:inset-x-6 sm:bottom-6 sm:h-[90dvh] sm:max-w-none xl:inset-x-[10vw] xl:h-[88dvh]"
            showCloseButton={false}
          >
            <DialogHeader className="sticky top-0 z-10 flex-row items-center justify-between border-b border-border bg-background px-4 py-3 text-left sm:px-6">
              <div>
                <DialogTitle>Profile preview</DialogTitle>
                <DialogDescription>
                  {isDirty
                    ? 'Includes your unsaved changes.'
                    : 'Showing your saved profile fields.'}
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Back to edit
                </Button>
              </DialogClose>
            </DialogHeader>
            <div className="mx-auto w-full max-w-4xl bg-secondary/40 p-4 sm:my-6 sm:rounded-lg sm:border sm:border-border sm:p-6">
              <div className="overflow-hidden rounded bg-background p-3 sm:p-5">
                <ProfileEditorPreview
                  form={form}
                  profile={profile}
                  sectionsVisibility={sectionsVisibility}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
