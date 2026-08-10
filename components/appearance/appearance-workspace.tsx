'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Doc } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { ProfileTypography } from '@/components/profile/profile-typography';
import { TemplateSelector } from '@/components/templates/template-selector';
import {
  PROFILE_FONT_OPTIONS,
  resolveProfileFontId,
  type ProfileFontId,
} from '@/lib/profile/typography';
import {
  getTemplate,
  resolveTemplateId,
  type TemplateId,
} from '@/lib/templates';
import { cn } from '@/lib/utils';

const themes = [
  { name: 'Sage', slug: 'sage' },
  { name: 'Ocean', slug: 'ocean' },
  { name: 'Rose', slug: 'rose' },
  { name: 'Amber', slug: 'amber' },
  { name: 'Slate', slug: 'slate' },
  { name: 'Sand', slug: 'sand' },
  { name: 'Cocoa', slug: 'cocoa' },
  { name: 'Peach', slug: 'peach' },
  { name: 'Forest', slug: 'forest' },
  { name: 'Olive', slug: 'olive' },
  { name: 'Teal', slug: 'teal' },
  { name: 'Mauve', slug: 'mauve' },
] as const;

type ThemeSlug = (typeof themes)[number]['slug'];

type TypographyPair = {
  headingFont: ProfileFontId;
  bodyFont: ProfileFontId;
};

const typographyPairsMatch = (left: TypographyPair, right: TypographyPair) =>
  left.headingFont === right.headingFont && left.bodyFont === right.bodyFont;

function formatYear(date: string): string {
  return date?.split('-')[0] ?? '';
}

function ProfilePreview({
  profile,
  templateId,
  theme,
  headingFont,
  bodyFont,
}: {
  profile: Doc<'profiles'>;
  templateId: TemplateId;
  theme: ThemeSlug;
  headingFont: ProfileFontId;
  bodyFont: ProfileFontId;
}) {
  const template = getTemplate(templateId);
  const topExperience = profile.experience.slice(0, 2);
  const topProjects = profile.projects?.slice(0, 2) ?? [];
  const topSkills = profile.skills.slice(0, 6);
  const subtitle = [profile.title, profile.location]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={`profile-theme theme-${theme} w-full`}>
      <div
        className={cn(
          'overflow-hidden rounded-[28px] bg-card p-5 text-card-foreground sm:p-7',
          templateId === 'modern' && 'sm:grid sm:grid-cols-[9rem_1fr] sm:gap-6',
          templateId === 'minimal' && 'mx-auto max-w-xl',
          templateId === 'creative' && 'sm:p-9'
        )}
      >
        <ProfileTypography headingFont={headingFont} bodyFont={bodyFont}>
          <div
            className={cn(
              'flex items-start justify-between gap-4',
              templateId === 'modern' &&
                'rounded-2xl bg-secondary p-4 sm:sticky sm:top-0 sm:flex-col',
              templateId === 'creative' && 'sm:min-h-40 sm:items-end',
              templateId === 'developer' && 'rounded-2xl bg-secondary/80 p-4'
            )}
          >
            <div className="min-w-0">
              <p className="mb-2 text-xs font-medium text-primary">
                {template.name}
              </p>
              <h3
                className={cn(
                  'break-words text-2xl font-semibold text-foreground sm:text-3xl',
                  templateId === 'creative' && 'sm:text-5xl',
                  templateId === 'minimal' && 'font-light'
                )}
              >
                {profile.name || 'Your Name'}
              </h3>
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>

          <div className={cn(templateId === 'modern' && 'sm:col-start-2')}>
            {topProjects.length > 0 && (
              <div className="mt-5">
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Selected work
                </p>
                <div
                  className={cn(
                    'grid gap-3',
                    templateId !== 'minimal' && 'sm:grid-cols-2',
                    templateId === 'developer' && 'sm:grid-cols-[7fr_5fr]',
                    templateId === 'creative' && 'sm:grid-cols-[1.3fr_0.7fr]'
                  )}
                >
                  {topProjects.map((project, index) => (
                    <div
                      key={project.id}
                      className={cn(
                        'overflow-hidden rounded-2xl bg-secondary/70',
                        templateId === 'creative' &&
                          index % 2 === 1 &&
                          'sm:translate-y-5'
                      )}
                    >
                      {project.images?.[0] && (
                        <img
                          src={project.images[0]}
                          alt=""
                          className="aspect-[16/9] w-full object-cover"
                        />
                      )}
                      <div className="p-3">
                        <p className="text-sm font-semibold text-foreground">
                          {project.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {project.description ||
                            project.company ||
                            'Project story and outcome'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topExperience.length > 0 && (
              <div className="mt-7">
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Experience
                </p>
                <div className="space-y-2">
                  {topExperience.map((experience) => (
                    <div
                      key={experience.id}
                      className="flex items-start justify-between gap-4 rounded-xl bg-muted/55 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {experience.role}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {experience.company}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs text-muted-foreground">
                        {formatYear(experience.startDate)} –{' '}
                        {experience.current
                          ? 'Present'
                          : formatYear(experience.endDate ?? '')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topSkills.length > 0 && (
              <div className="mt-5">
                <p className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {topSkills.map((skill) => (
                    <span
                      key={skill}
                      className="border border-border bg-secondary px-2.5 py-1 text-[11px] text-secondary-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 rounded-full bg-secondary/70 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="break-all text-[11px] text-muted-foreground">
                opencv.app/@{profile.username}
              </span>
            </div>
          </div>
        </ProfileTypography>
      </div>
    </div>
  );
}

function FontPicker({
  label,
  value,
  otherFont,
  kind,
  disabled,
  onChange,
}: {
  label: string;
  value: ProfileFontId;
  otherFont: ProfileFontId;
  kind: 'heading' | 'body';
  disabled: boolean;
  onChange: (font: ProfileFontId) => void;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="text-base font-semibold text-foreground">
        {label}
      </legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {PROFILE_FONT_OPTIONS.map((font) => {
          const isSelected = value === font.id;
          const headingFont = kind === 'heading' ? font.id : otherFont;
          const bodyFont = kind === 'body' ? font.id : otherFont;

          return (
            <label
              key={font.id}
              className={cn(
                'rounded border border-border p-3 text-left transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring',
                isSelected
                  ? 'border-foreground ring-1 ring-foreground'
                  : 'hover:bg-secondary',
                disabled && 'cursor-wait opacity-60'
              )}
            >
              <input
                type="radio"
                name={`typography-${kind}`}
                value={font.id}
                checked={isSelected}
                onChange={() => onChange(font.id)}
                className="sr-only"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{font.label}</span>
                {isSelected && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </div>
              <ProfileTypography headingFont={headingFont} bodyFont={bodyFont}>
                {kind === 'heading' ? (
                  <p className="mt-3 text-xl font-semibold">Alex Morgan</p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Clear, considered profile content for every reader.
                  </p>
                )}
              </ProfileTypography>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function AppearanceWorkspace({ profile }: { profile: Doc<'profiles'> }) {
  const updateColorTheme = useMutation(api.profiles.updateColorTheme);
  const updateTypography = useMutation(api.profiles.updateTypography);
  const currentTheme = (profile.colorTheme ?? 'sage') as ThemeSlug;
  const [selectedTemplate, setSelectedTemplate] = useState(() =>
    resolveTemplateId(profile.templateId)
  );
  const [previewTemplateId, setPreviewTemplateId] = useState<TemplateId | null>(
    null
  );
  const [selectedTheme, setSelectedTheme] = useState<ThemeSlug>(currentTheme);
  const [previewTheme, setPreviewTheme] = useState<ThemeSlug>(currentTheme);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [themeStatus, setThemeStatus] = useState<'idle' | 'saved' | 'error'>(
    'idle'
  );
  const savedHeadingFont = resolveProfileFontId(profile.headingFont);
  const savedBodyFont = resolveProfileFontId(profile.bodyFont);
  const [previewHeadingFont, setPreviewHeadingFont] =
    useState<ProfileFontId>(savedHeadingFont);
  const [previewBodyFont, setPreviewBodyFont] =
    useState<ProfileFontId>(savedBodyFont);
  const [isSavingTypography, setIsSavingTypography] = useState(false);
  const [typographyStatus, setTypographyStatus] = useState<
    'idle' | 'saved' | 'error'
  >('idle');
  const [activePanel, setActivePanel] = useState<
    'template' | 'palette' | 'type'
  >('template');
  const confirmedTypographyRef = useRef<TypographyPair>({
    headingFont: savedHeadingFont,
    bodyFont: savedBodyFont,
  });
  const awaitingTypographyEchoRef = useRef<TypographyPair | null>(null);
  const isTypographySavePendingRef = useRef(false);

  useEffect(() => {
    setSelectedTemplate(resolveTemplateId(profile.templateId));
  }, [profile.templateId]);

  useEffect(() => {
    setSelectedTheme(currentTheme);
    setPreviewTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const subscriptionTypography = {
      headingFont: savedHeadingFont,
      bodyFont: savedBodyFont,
    };
    const awaitingTypographyEcho = awaitingTypographyEchoRef.current;

    if (awaitingTypographyEcho) {
      if (
        typographyPairsMatch(subscriptionTypography, awaitingTypographyEcho)
      ) {
        awaitingTypographyEchoRef.current = null;
      }
      return;
    }

    if (isTypographySavePendingRef.current) return;

    confirmedTypographyRef.current = subscriptionTypography;
    setPreviewHeadingFont(subscriptionTypography.headingFont);
    setPreviewBodyFont(subscriptionTypography.bodyFont);
  }, [isSavingTypography, savedBodyFont, savedHeadingFont]);

  const handleThemeSelect = async (theme: ThemeSlug) => {
    if (isSavingTheme || theme === selectedTheme) return;

    const previousTheme = selectedTheme;
    setSelectedTheme(theme);
    setPreviewTheme(theme);
    setIsSavingTheme(true);
    setThemeStatus('idle');
    try {
      await updateColorTheme({ colorTheme: theme });
      setThemeStatus('saved');
      toast.success('Color palette updated');
    } catch {
      setSelectedTheme(previousTheme);
      setPreviewTheme(previousTheme);
      setThemeStatus('error');
      toast.error('Failed to update color palette');
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleTypographySave = async () => {
    if (isSavingTypography) return;

    const submittedTypography = {
      headingFont: previewHeadingFont,
      bodyFont: previewBodyFont,
    };
    isTypographySavePendingRef.current = true;
    setIsSavingTypography(true);
    setTypographyStatus('idle');
    try {
      await updateTypography(submittedTypography);
      confirmedTypographyRef.current = submittedTypography;
      awaitingTypographyEchoRef.current = submittedTypography;
      setTypographyStatus('saved');
      toast.success('Typography updated');
    } catch {
      setPreviewHeadingFont(confirmedTypographyRef.current.headingFont);
      setPreviewBodyFont(confirmedTypographyRef.current.bodyFont);
      setTypographyStatus('error');
      toast.error('Failed to update typography');
    } finally {
      isTypographySavePendingRef.current = false;
      setIsSavingTypography(false);
    }
  };

  const typographyChanged = !typographyPairsMatch(
    { headingFont: previewHeadingFont, bodyFont: previewBodyFont },
    confirmedTypographyRef.current
  );

  return (
    <main
      className="min-h-screen bg-background px-3 py-5 sm:px-6 sm:py-8"
      data-route-landmark="appearance-settings"
    >
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 px-2">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl">
              Choose your profile appearance
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Template and palette changes save when selected. Save typography
              changes separately.
            </p>
          </div>
        </header>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(360px,440px)_minmax(0,1fr)]">
          <section className="min-w-0 xl:pr-2" aria-label="Appearance controls">
            <div
              className="grid grid-cols-3 rounded border border-border"
              role="tablist"
              aria-label="Appearance settings"
            >
              {(['template', 'palette', 'type'] as const).map((panel) => (
                <button
                  key={panel}
                  type="button"
                  role="tab"
                  aria-selected={activePanel === panel}
                  onClick={() => setActivePanel(panel)}
                  className={cn(
                    'min-h-11 px-3 text-sm font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    activePanel === panel
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {panel}
                </button>
              ))}
            </div>

            {activePanel === 'template' && (
              <div className="mt-6 border-t border-border pt-6" role="tabpanel">
                <div className="mb-5">
                  <h2 className="text-xl font-semibold text-foreground">
                    Template
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Hover a layout to preview it. Select to save.
                  </p>
                </div>
                <TemplateSelector
                  currentTemplate={selectedTemplate}
                  onTemplateChange={setSelectedTemplate}
                  onPreview={setPreviewTemplateId}
                  showHeading={false}
                />
              </div>
            )}

            {activePanel === 'palette' && (
              <section
                className="mt-6 border-t border-border pt-6"
                role="tabpanel"
                aria-labelledby="appearance-palette"
              >
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2
                      id="appearance-palette"
                      className="text-xl font-semibold text-foreground"
                    >
                      Palette
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Hover or focus to preview. Select to save.
                    </p>
                  </div>
                  <p
                    aria-live="polite"
                    className="text-xs text-muted-foreground"
                  >
                    {isSavingTheme
                      ? 'Saving palette...'
                      : themeStatus === 'saved'
                        ? 'Palette saved'
                        : themeStatus === 'error'
                          ? 'Palette was not saved'
                          : 'Saved when selected'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {themes.map((theme) => {
                    const isActive = selectedTheme === theme.slug;
                    const isPreviewing = previewTheme === theme.slug;

                    return (
                      <button
                        key={theme.slug}
                        type="button"
                        disabled={isSavingTheme}
                        onClick={() => void handleThemeSelect(theme.slug)}
                        onMouseEnter={() => setPreviewTheme(theme.slug)}
                        onMouseLeave={() => setPreviewTheme(selectedTheme)}
                        onFocus={() => setPreviewTheme(theme.slug)}
                        onBlur={() => setPreviewTheme(selectedTheme)}
                        className={cn(
                          `profile-theme theme-${theme.slug}`,
                          'overflow-hidden rounded border border-border p-1 text-left transition-[background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60',
                          isPreviewing
                            ? 'ring-2 ring-accent ring-offset-2 ring-offset-background'
                            : 'hover:bg-secondary'
                        )}
                        aria-pressed={isActive}
                      >
                        <span
                          className="flex h-[72px] overflow-hidden rounded-xl"
                          aria-hidden="true"
                        >
                          <span className="flex-[1.2] bg-background" />
                          <span className="flex-1 bg-primary" />
                          <span className="flex-[0.8] bg-secondary" />
                        </span>
                        <span className="flex items-center justify-between px-3 py-2">
                          <span className="text-xs font-medium text-foreground">
                            {theme.name}
                          </span>
                          {isActive && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                              <Check className="h-2.5 w-2.5 text-primary-foreground" />
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {activePanel === 'type' && (
              <section
                className="mt-6 border-t border-border pt-6"
                role="tabpanel"
                aria-labelledby="appearance-typography"
              >
                <div className="mb-6">
                  <h2
                    id="appearance-typography"
                    className="text-xl font-semibold text-foreground"
                  >
                    Typography
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Choose heading and body fonts, then save the pairing.
                  </p>
                </div>

                <div className="space-y-8">
                  <FontPicker
                    label="Heading font"
                    value={previewHeadingFont}
                    otherFont={previewBodyFont}
                    kind="heading"
                    disabled={isSavingTypography}
                    onChange={(font) => {
                      setPreviewHeadingFont(font);
                      setTypographyStatus('idle');
                    }}
                  />
                  <FontPicker
                    label="Body font"
                    value={previewBodyFont}
                    otherFont={previewHeadingFont}
                    kind="body"
                    disabled={isSavingTypography}
                    onChange={(font) => {
                      setPreviewBodyFont(font);
                      setTypographyStatus('idle');
                    }}
                  />
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isSavingTypography || !typographyChanged}
                    aria-busy={isSavingTypography}
                    onClick={() => void handleTypographySave()}
                    className="min-h-11 rounded bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingTypography
                      ? 'Saving typography...'
                      : 'Save typography'}
                  </button>
                  <p
                    aria-live="polite"
                    className="text-sm text-muted-foreground"
                  >
                    {isSavingTypography
                      ? 'Saving your font pairing.'
                      : typographyStatus === 'saved'
                        ? 'Typography saved'
                        : typographyStatus === 'error'
                          ? 'Typography was not saved'
                          : typographyChanged
                            ? 'Ready to save'
                            : 'Current pairing saved'}
                  </p>
                </div>
              </section>
            )}
          </section>

          <aside
            className="order-first rounded-lg border border-border bg-background p-4 xl:sticky xl:top-4 xl:order-none xl:min-h-[calc(100vh-2rem)] xl:p-6"
            aria-labelledby="appearance-preview"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2
                  id="appearance-preview"
                  className="font-display text-base font-semibold text-foreground"
                >
                  Live preview
                </h2>
              </div>
              <p className="font-mono text-xs text-muted-foreground">
                Updates instantly
              </p>
            </div>
            <div className="flex min-h-[460px] items-center justify-center overflow-hidden rounded bg-secondary/40 p-3 sm:min-h-[560px] sm:p-6 xl:min-h-[calc(100vh-7.5rem)]">
              <ProfilePreview
                profile={profile}
                templateId={previewTemplateId ?? selectedTemplate}
                theme={previewTheme}
                headingFont={previewHeadingFont}
                bodyFont={previewBodyFont}
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
