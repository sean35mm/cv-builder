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
import { LinkedInImportDialog } from '@/components/editor/linkedin-import-dialog';
import { Phase5Tools } from '@/components/editor/phase5-tools';
import { useProfileFieldArrays } from '@/components/editor/hooks/use-profile-field-arrays';
import { useUnsavedChangesWarning } from '@/components/editor/hooks/use-unsaved-changes-warning';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { VersionManager } from '@/components/versions/version-manager';
import { api } from '@/convex/_generated/api';
import {
  getProfileAccessFlags,
  resolveProfileAccessMode,
  type ProfileAccessMode,
} from '@/lib/profile/access';
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

  const persistedAccessMode = resolveProfileAccessMode(
    profile.isPublic,
    profile.isDirectoryListed,
    profile.accessMode
  );
  const [accessMode, setAccessMode] = useState<ProfileAccessMode>(
    persistedAccessMode
  );
  const [selectedAccessMode, setSelectedAccessMode] =
    useState<ProfileAccessMode>(persistedAccessMode);
  const [passcode, setPasscode] = useState('');
  const [accessSubmitting, setAccessSubmitting] = useState(false);
  const sectionsOrder = useWatch({
    control: form.control,
    name: 'sectionsOrder',
  });
  const { isSubmitting, isDirty } = form.formState;
  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    setAccessMode(persistedAccessMode);
    setSelectedAccessMode(persistedAccessMode);
  }, [persistedAccessMode]);

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
  const alignLegacyAccessFlags = (mode: ProfileAccessMode) => {
    const flags = getProfileAccessFlags(mode);
    form.setValue('isPublic', flags.isPublic, {
      shouldDirty: false,
    });
    form.setValue('isDirectoryListed', flags.isDirectoryListed, {
      shouldDirty: false,
    });
  };
  const updateAccess = async () => {
    setAccessSubmitting(true);
    try {
      const response = await fetch('/api/profile-access/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedAccessMode,
          ...(selectedAccessMode === 'passcode' ? { passcode } : {}),
        }),
      });
      setPasscode('');
      if (!response.ok) throw new Error('Unable to update access');
      setAccessMode(selectedAccessMode);
      alignLegacyAccessFlags(selectedAccessMode);
      toast.success('Profile access updated');
    } catch {
      setPasscode('');
      toast.error('Unable to update profile access');
    } finally {
      setAccessSubmitting(false);
    }
  };
  const revokeAccess = async () => {
    setAccessSubmitting(true);
    try {
      const response = await fetch('/api/profile-access/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!response.ok) throw new Error('Unable to revoke access');
      toast.success('All profile access grants revoked');
    } catch {
      toast.error('Unable to revoke profile access');
    } finally {
      setAccessSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handlePreSubmit}
        className="flex min-h-screen overflow-hidden"
      >
        <main className="w-full overflow-y-auto border-r bg-card lg:w-[58%]">
          <div className="space-y-8 p-4 sm:p-6 md:p-10">
            <header className="relative z-10 border-b pb-6">
              <p className="platform-kicker text-muted-foreground">01 / Publishing desk</p>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
                <div>
                <h1 className="font-serif text-4xl font-normal tracking-[-0.03em] text-foreground md:text-5xl">
                  {profile.name || 'Your CV'}
                </h1>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground" role="status">
                  {isDirty ? 'Status: unsaved changes' : 'Status: all changes saved'}
                </p>
                </div>
              <div className="flex flex-wrap items-center gap-2">
                <LinkedInImportDialog form={form} />
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
                {accessMode !== 'private' && profile.username && (
                  <a
                    href={`/api/pdf?username=${encodeURIComponent(profile.username)}`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-[2px] border px-3 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-foreground/30 hover:text-foreground"
                  >
                    <Download className="h-3 w-3" />
                    PDF
                  </a>
                )}
                {accessMode !== 'private' && profile.username && (
                  <a
                    href={`/@${profile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-[2px] border px-3 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-foreground/30 hover:text-foreground"
                  >
                    View Profile
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              </div>
            </header>

            <details className="border bg-secondary" open>
              <summary className="flex min-h-11 cursor-pointer items-center px-4 font-medium">Publication status &amp; access</summary>
              <div className="space-y-3 border-t p-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="profile-access-mode"
                  className="text-sm font-medium text-foreground"
                >
                  Profile access
                </label>
                <select
                  id="profile-access-mode"
                  value={selectedAccessMode}
                  onChange={(event) => {
                    setSelectedAccessMode(
                      event.target.value as ProfileAccessMode
                    );
                    setPasscode('');
                  }}
                  className="flex h-11 w-full max-w-xs rounded-[2px] border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px]"
                >
                  <option value="private">Private</option>
                  <option value="passcode">Passcode</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public</option>
                </select>
              </div>

              {accessMode === 'private' && (
                <p className="text-sm text-muted-foreground">
                  Only you can access this profile. Its public URL, contact form,
                  PDF, testimonials, project images, and analytics are disabled.
                </p>
              )}
              {accessMode === 'passcode' && (
                <p className="text-sm text-muted-foreground">
                  Visitors need the passcode. The profile is excluded from the
                  directory and search indexing. Recipients can still reshare,
                  download, or capture content after unlocking.
                </p>
              )}
              {accessMode === 'unlisted' && (
                <p className="text-sm text-muted-foreground">
                  Anyone with the direct link can view this profile. Contact,
                  PDF, approved testimonials, visible project images, and
                  analytics stay enabled. It is excluded from the directory and
                  asks search engines not to index it.
                </p>
              )}
              {accessMode === 'public' && (
                <p className="text-sm text-muted-foreground">
                  Anyone can view this profile. It is eligible for the directory
                  and search indexing, with all public profile features enabled.
                </p>
              )}

              {accessMode !== 'private' && profile.username && (
                <p className="text-sm text-muted-foreground">
                  Profile URL:{' '}
                  <a
                    href={`/@${profile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline text-primary hover:text-primary/80"
                  >
                    /@{profile.username}
                  </a>
                </p>
              )}
              {selectedAccessMode === 'passcode' && (
                <div className="max-w-xs space-y-1.5">
                  <label htmlFor="profile-access-passcode" className="text-sm font-medium">
                    {accessMode === 'passcode' ? 'New passcode' : 'Passcode'}
                  </label>
                  <input
                    id="profile-access-passcode"
                    type="password"
                    autoComplete="new-password"
                    value={passcode}
                    onChange={(event) => setPasscode(event.target.value)}
                    minLength={10}
                    className="flex h-11 w-full rounded-[2px] border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use 10–128 characters. Spaces are preserved.
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void updateAccess()}
                  disabled={
                    accessSubmitting ||
                    (selectedAccessMode === accessMode &&
                      selectedAccessMode !== 'passcode') ||
                    (selectedAccessMode === 'passcode' && !passcode)
                  }
                >
                  {accessSubmitting
                    ? 'Updating…'
                    : accessMode === 'passcode' &&
                        selectedAccessMode === 'passcode'
                      ? 'Change passcode'
                      : 'Apply access mode'}
                </Button>
                {accessMode === 'passcode' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void revokeAccess()}
                    disabled={accessSubmitting}
                  >
                    Revoke unlocked browsers
                  </Button>
                )}
              </div>
              </div>
            </details>

            <details className="border">
              <summary className="flex min-h-11 cursor-pointer items-center px-4 font-medium">
                Publishing tools / exports, locales, analytics, writing
              </summary>
              <div className="border-t p-4">
                <Phase5Tools profile={profile} form={form} />
              </div>
            </details>

            <section className="grid grid-cols-1 gap-8 border-t pt-8 md:grid-cols-[180px_1fr]" aria-label="Profile outline and fields">
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
            </section>
          </div>
        </main>

        <aside className="sticky top-0 hidden h-screen w-[42%] overflow-y-auto bg-muted/30 lg:block" aria-label="Page preview">
          <div className="space-y-4 p-6 md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="platform-kicker text-muted-foreground">
                Page preview / live
              </h2>
            </div>
            <div className="border bg-card p-4">
              <ProfileEditorPreview
                form={form}
                profile={profile}
                sectionsVisibility={sectionsVisibility}
              />
            </div>
          </div>
        </aside>
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
