'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { useMutation } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { Check, ChevronsUpDown, Copy, Eye, Send } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useProfileFieldArrays } from '@/components/editor/hooks/use-profile-field-arrays';
import {
  getSectionForInvalidRoot,
  INITIAL_ACTIVE_SECTION,
  mergeDraggableSectionOrder,
  SECTION_LABELS,
} from '@/components/editor/profile-editor-config';
import { ProfileEditorSection } from '@/components/editor/profile-editor-section';
import { BrandMark } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { AccountMenu } from '@/components/workspace/account-menu';
import { DesignPanel } from '@/components/workspace/design-panel';
import {
  buildSavePayload,
  collectSavedImageTokens,
  createDraftResolver,
} from '@/components/workspace/draft';
import { PreviewPane } from '@/components/workspace/preview';
import { SectionNav } from '@/components/workspace/section-nav';
import { ShareDialog } from '@/components/workspace/share-dialog';
import {
  SaveCountContext,
  useAutosave,
  type SaveStatus,
} from '@/components/workspace/use-autosave';
import { api } from '@/convex/_generated/api';
import type { SectionId } from '@/lib/profile/domain';
import {
  resolveProfileAccessMode,
  type ProfileAccessMode,
} from '@/lib/profile/access';
import {
  toFormValues,
  type ProfileUpdateFormValues,
} from '@/lib/profile/editor';
import { createProfileUpdateFormSchema } from '@/lib/profile/editor-schema';
import type { PaletteId } from '@/lib/palettes';
import type { TemplateId } from '@/lib/templates';
import { cn } from '@/lib/utils';

export type WorkspaceProfile = NonNullable<
  FunctionReturnType<typeof api.profiles.getMyProfile>
>;

type Tab = 'content' | 'design';

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const afterPaint = (callback: () => void) =>
  requestAnimationFrame(() => requestAnimationFrame(callback));

const tabTriggerClassName =
  'h-6 rounded-[5px] px-2 text-[12.5px] font-medium text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:ring-1 data-[state=active]:ring-border sm:px-2.5 pointer-coarse:h-9';

export function Workspace({
  profile,
  email,
}: {
  profile: WorkspaceProfile;
  email?: string;
}) {
  // The form is seeded once per profile (the page keys this component by
  // _id). Live server updates after each save never reset what's typed.
  const [initialProfile] = useState(profile);
  const schema = useMemo(
    () => createProfileUpdateFormSchema(initialProfile),
    [initialProfile]
  );
  const [defaultValues] = useState(() => toFormValues(initialProfile));
  const resolver = useMemo(() => createDraftResolver(schema), [schema]);
  const form = useForm<ProfileUpdateFormValues>({
    defaultValues,
    resolver,
    mode: 'onTouched',
  });
  const fieldArrays = useProfileFieldArrays(form.control, generateId);

  const accessMode = resolveProfileAccessMode(
    profile.isPublic,
    profile.isDirectoryListed,
    profile.accessMode
  );
  const liveProfile = useRef(profile);
  // An access change the server accepted but the live query hasn't shown
  // yet. Saves use it so they can't race the change and revert it.
  const acceptedAccessMode = useRef<ProfileAccessMode | null>(null);
  useEffect(() => {
    liveProfile.current = profile;
  }, [profile]);
  useEffect(() => {
    acceptedAccessMode.current = null;
  }, [accessMode]);
  const onAccessChanged = (mode: ProfileAccessMode) => {
    const live = liveProfile.current;
    const liveMode = resolveProfileAccessMode(
      live.isPublic,
      live.isDirectoryListed,
      live.accessMode
    );
    acceptedAccessMode.current = mode === liveMode ? null : mode;
  };

  const updateProfile = useMutation(api.profiles.updateProfile);
  const save = useCallback(
    (payload: Parameters<typeof buildSavePayload>[0]) =>
      updateProfile(
        buildSavePayload(
          payload,
          liveProfile.current,
          acceptedAccessMode.current
        )
      ),
    [updateProfile]
  );
  const onSaved = useCallback(
    (payload: Parameters<typeof buildSavePayload>[0]) => {
      const tokens = collectSavedImageTokens(payload);
      if (tokens.size === 0) return;
      const avatar = form.getValues('avatar');
      if (avatar && tokens.has(avatar)) {
        form.setValue('avatar', tokens.get(avatar) ?? avatar);
      }
      for (const section of ['projects', 'exhibitions', 'awards'] as const) {
        form.getValues(section).forEach((entry, index) => {
          const images = entry.images ?? [];
          if (!images.some((image) => tokens.has(image))) return;
          form.setValue(
            `${section}.${index}.images`,
            images.map((image) => tokens.get(image) ?? image)
          );
        });
      }
    },
    [form]
  );
  const autosave = useAutosave({ form, schema, save, onSaved });
  const { flush } = autosave;

  const [tab, setTab] = useState<Tab>('content');
  const [section, setSection] = useState<SectionId>(INITIAL_ACTIVE_SECTION);
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const host =
    typeof window === 'undefined' ? 'opencv.app' : window.location.host;
  const profileUrl = `${origin}/u/${profile.username}`;
  const displayUrl = `${host}/u/${profile.username}`;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void flush();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flush]);

  const selectSection = (next: SectionId) => {
    void flush();
    setSection(next);
    setSectionPickerOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  };

  const changeTab = (next: string) => {
    void flush();
    setTab(next as Tab);
  };

  const reorderSections = (order: SectionId[]) => {
    form.setValue(
      'sectionsOrder',
      mergeDraggableSectionOrder(form.getValues('sectionsOrder'), order),
      { shouldDirty: true }
    );
  };

  const revealInvalidFields = async () => {
    setTab('content');
    await form.trigger();
    setSection(getSectionForInvalidRoot(form.formState.errors));
    afterPaint(() => {
      const invalid = mainRef.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"]'
      );
      invalid?.focus();
      invalid?.scrollIntoView({ block: 'center' });
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const updateTemplate = useMutation(
    api.profiles.updateTemplate
  ).withOptimisticUpdate((store, args) => {
    const current = store.getQuery(api.profiles.getMyProfile, {});
    if (current) {
      store.setQuery(
        api.profiles.getMyProfile,
        {},
        {
          ...current,
          templateId: args.templateId,
        }
      );
    }
  });
  const updateColorTheme = useMutation(
    api.profiles.updateColorTheme
  ).withOptimisticUpdate((store, args) => {
    const current = store.getQuery(api.profiles.getMyProfile, {});
    if (current) {
      store.setQuery(
        api.profiles.getMyProfile,
        {},
        {
          ...current,
          colorTheme: args.colorTheme,
        }
      );
    }
  });
  // Convex rolls the optimistic value back on failure; we only explain why.
  const chooseTemplate = (templateId: TemplateId) => {
    updateTemplate({ templateId }).catch(() =>
      toast.error("Couldn't change the template. Try again.")
    );
  };
  const choosePalette = (colorTheme: PaletteId) => {
    updateColorTheme({ colorTheme }).catch(() =>
      toast.error("Couldn't change the color. Try again.")
    );
  };

  const preview = (className?: string, headerClassName?: string) => (
    <PreviewPane
      form={form}
      owner={profile}
      templateId={profile.templateId}
      colorTheme={profile.colorTheme}
      className={className}
      headerClassName={headerClassName}
    />
  );

  const sectionNav = (
    <SectionNav
      form={form}
      active={section}
      onSelect={selectSection}
      onReorder={reorderSections}
    />
  );

  return (
    <Form {...form}>
      <Tabs.Root
        value={tab}
        onValueChange={changeTab}
        className="flex h-dvh flex-col bg-background"
      >
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:gap-3 sm:px-3">
          <Link
            href="/"
            aria-label="OpenCV home"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-foreground"
          >
            <BrandMark />
          </Link>
          <div className="hidden min-w-0 items-center gap-0.5 md:flex">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate rounded px-1 font-mono text-[12.5px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {displayUrl}
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={copied ? 'Copied' : 'Copy profile link'}
              onClick={() => void copyLink()}
            >
              {copied ? (
                <Check className="size-3.5 text-success" aria-hidden="true" />
              ) : (
                <Copy className="size-3.5" aria-hidden="true" />
              )}
            </Button>
          </div>
          <Tabs.List
            aria-label="Workspace"
            className="flex h-7 shrink-0 items-center gap-0.5 rounded-md bg-secondary p-0.5 md:ml-2 pointer-coarse:h-10"
          >
            <Tabs.Trigger value="content" className={tabTriggerClassName}>
              Content
            </Tabs.Trigger>
            <Tabs.Trigger value="design" className={tabTriggerClassName}>
              Design
            </Tabs.Trigger>
          </Tabs.List>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <SaveIndicator
              status={autosave.status}
              invalidCount={autosave.invalidCount}
              onRetry={() => void flush()}
              onFix={() => void revealInvalidFields()}
            />
            {tab === 'content' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="max-sm:w-7 max-sm:px-0 max-sm:pointer-coarse:w-10 xl:hidden"
                aria-label="Preview"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye aria-hidden="true" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="max-sm:w-7 max-sm:px-0 max-sm:pointer-coarse:w-10"
              aria-label="Share"
              onClick={() => setShareOpen(true)}
            >
              <Send className="sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <AccountMenu
              form={form}
              email={email}
              name={profile.name}
              beforeSignOut={flush}
              afterDeleteRequested={autosave.discard}
            />
          </div>
        </header>

        <Tabs.Content
          value="content"
          className="flex min-h-0 flex-1 focus-visible:outline-none"
        >
          <aside className="scroll-quiet hidden w-60 shrink-0 overflow-y-auto border-r border-border p-2 md:block">
            {sectionNav}
          </aside>
          <main
            ref={mainRef}
            className="scroll-quiet min-h-0 min-w-0 flex-1 overflow-y-auto"
          >
            <div className="mx-auto w-full max-w-[600px] px-4 pt-4 pb-24 sm:px-6 md:px-8 md:pt-10">
              <Popover
                open={sectionPickerOpen}
                onOpenChange={setSectionPickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="mb-6 w-full justify-between md:hidden"
                    aria-label={`Section: ${SECTION_LABELS[section]}`}
                  >
                    {SECTION_LABELS[section]}
                    <ChevronsUpDown
                      className="size-3.5 text-subtle"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="scroll-quiet max-h-[70dvh] w-(--radix-popover-trigger-width) overflow-y-auto p-1.5"
                >
                  {sectionNav}
                </PopoverContent>
              </Popover>
              <h1 className="mb-6 text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                {SECTION_LABELS[section]}
              </h1>
              <SaveCountContext.Provider value={autosave.getSaveCount}>
                <ProfileEditorSection
                  section={section}
                  form={form}
                  fieldArrays={fieldArrays}
                />
              </SaveCountContext.Provider>
            </div>
          </main>
          <aside
            aria-label="Preview"
            className="hidden w-[440px] shrink-0 border-l border-border xl:flex 2xl:w-[560px]"
          >
            {preview()}
          </aside>
        </Tabs.Content>

        <Tabs.Content
          value="design"
          className="scroll-quiet flex min-h-0 flex-1 flex-col overflow-y-auto focus-visible:outline-none md:flex-row md:overflow-hidden"
        >
          <aside className="shrink-0 border-b border-border md:scroll-quiet md:w-72 md:overflow-y-auto md:border-r md:border-b-0">
            <DesignPanel
              templateId={profile.templateId}
              colorTheme={profile.colorTheme}
              onTemplateChange={chooseTemplate}
              onPaletteChange={choosePalette}
            />
          </aside>
          <div className="flex shrink-0 md:min-h-0 md:min-w-0 md:flex-1">
            {preview()}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="bottom" className="h-dvh gap-0 p-0">
          <SheetTitle className="sr-only">Preview</SheetTitle>
          {preview('flex-1', 'h-12 pr-12')}
        </SheetContent>
      </Sheet>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        username={profile.username}
        profileUrl={profileUrl}
        displayUrl={displayUrl}
        accessMode={accessMode}
        runAccessChange={autosave.exclusive}
        onAccessChanged={onAccessChanged}
      />
    </Form>
  );
}

const STATUS_LABELS: Record<Exclude<SaveStatus, 'invalid'>, string> = {
  saved: 'Saved',
  pending: 'Unsaved',
  saving: 'Saving…',
  error: "Couldn't save",
};

function SaveIndicator({
  status,
  invalidCount,
  onRetry,
  onFix,
}: {
  status: SaveStatus;
  invalidCount: number;
  onRetry: () => void;
  onFix: () => void;
}) {
  const failed = status === 'error' || status === 'invalid';
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex h-7 items-center gap-1.5 text-[12px]',
        failed ? 'text-destructive' : 'text-muted-foreground'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 shrink-0 rounded-full transition-colors duration-150',
          status === 'saved' && 'bg-success',
          status === 'pending' && 'bg-subtle',
          status === 'saving' && 'animate-pulse bg-muted-foreground',
          failed && 'bg-destructive'
        )}
      />
      {status === 'invalid' ? (
        <button
          type="button"
          onClick={onFix}
          className="rounded underline-offset-2 hover:underline"
        >
          Fix {invalidCount}
          <span className="max-sm:sr-only">
            {' '}
            {invalidCount === 1 ? 'field' : 'fields'}
          </span>
        </button>
      ) : status === 'error' ? (
        <>
          <span className="max-sm:sr-only">{STATUS_LABELS.error} ·</span>
          <button
            type="button"
            onClick={onRetry}
            className="rounded underline-offset-2 hover:underline"
          >
            Retry
          </button>
        </>
      ) : (
        <span className="max-sm:sr-only">{STATUS_LABELS[status]}</span>
      )}
    </div>
  );
}
