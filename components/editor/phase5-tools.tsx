'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import type { ProfileUpdateFormValues } from '@/lib/profile/editor';
import { DEFAULT_PROFILE_LOCALE } from '@/lib/profile/locales';

type Props = {
  profile: {
    username: string;
    allowEmbed?: boolean;
    analyticsEnabled?: boolean;
    analyticsDigestOptIn?: boolean;
    defaultLocale?: string;
    locales?: string[];
  };
  form: UseFormReturn<ProfileUpdateFormValues>;
};

const inputClass =
  'flex min-h-11 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm';
const AI_FIELDS = [
  'name',
  'title',
  'bio',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
] as const;

export function Phase5Tools({ profile, form }: Props) {
  const updateSettings = useMutation(api.phase5Settings.update);
  const configureLocales = useMutation(api.profileLocales.configureMyLocales);
  const saveTranslation = useMutation(api.profileLocales.saveMyTranslation);
  const defaultLocale = profile.defaultLocale ?? DEFAULT_PROFILE_LOCALE;
  const initialLocales = useMemo(
    () => profile.locales ?? [defaultLocale],
    [defaultLocale, profile.locales]
  );
  const [locales, setLocales] = useState(initialLocales);
  const [selectedLocale, setSelectedLocale] = useState(defaultLocale);
  const [newLocale, setNewLocale] = useState('');
  const translation = useQuery(
    api.profileLocales.getMyTranslation,
    selectedLocale === defaultLocale ? 'skip' : { locale: selectedLocale }
  );
  const [translationJson, setTranslationJson] = useState('');
  const [allowEmbed, setAllowEmbed] = useState(profile.allowEmbed ?? false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    profile.analyticsEnabled !== false
  );
  const [digestOptIn, setDigestOptIn] = useState(
    profile.analyticsDigestOptIn ?? false
  );
  const [jobDescription, setJobDescription] = useState('');
  const [aiKind, setAiKind] = useState<'section' | 'cover_letter'>('section');
  const [aiSection, setAiSection] = useState<'bio' | 'title'>('bio');
  const [selectedAiFields, setSelectedAiFields] = useState<string[]>([
    'title',
    'bio',
    'experience',
    'skills',
  ]);
  const [draft, setDraft] = useState('');
  const [reviewNotes, setReviewNotes] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const aiEnabled = process.env.NEXT_PUBLIC_AI_WRITING_ENABLED === 'true';

  useEffect(() => {
    if (selectedLocale === defaultLocale) {
      setTranslationJson('');
    } else if (translation !== undefined) {
      setTranslationJson(
        JSON.stringify(translation ?? { text: {}, lists: {} }, null, 2)
      );
    }
  }, [defaultLocale, selectedLocale, translation]);

  const persistSettings = async () => {
    try {
      await updateSettings({
        allowEmbed,
        analyticsEnabled,
        analyticsDigestOptIn: digestOptIn,
      });
      toast.success('Privacy and sharing settings updated');
    } catch {
      toast.error('Unable to update settings');
    }
  };

  const addLocale = async () => {
    try {
      const next = [...locales, newLocale];
      await configureLocales({ locales: next, defaultLocale });
      setLocales(next);
      setSelectedLocale(newLocale);
      setNewLocale('');
      toast.success('Locale added');
    } catch {
      toast.error('Use a valid BCP-47 locale (maximum five)');
    }
  };

  const removeLocale = async () => {
    if (selectedLocale === defaultLocale) return;
    try {
      const next = locales.filter((locale) => locale !== selectedLocale);
      await configureLocales({ locales: next, defaultLocale });
      setLocales(next);
      setSelectedLocale(defaultLocale);
      toast.success('Locale removed');
    } catch {
      toast.error('Unable to remove locale');
    }
  };

  const persistTranslation = async () => {
    try {
      const overlay = JSON.parse(translationJson) as {
        text: Record<string, string>;
        lists: Record<string, string[]>;
      };
      await saveTranslation({ locale: selectedLocale, overlay });
      toast.success('Translation saved');
    } catch {
      toast.error('Translation JSON is invalid or exceeds its limits');
    }
  };

  const requestDraft = async () => {
    if (!aiEnabled) return;
    setAiLoading(true);
    setDraft('');
    setReviewNotes([]);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: aiKind,
          section: aiSection,
          jobDescription,
          locale: selectedLocale,
          selectedFields: selectedAiFields,
        }),
      });
      const body = (await response.json()) as {
        draft?: string;
        reviewNotes?: string[];
      };
      if (!response.ok || typeof body.draft !== 'string') throw new Error();
      setDraft(body.draft);
      setReviewNotes(body.reviewNotes ?? []);
    } catch {
      toast.error('Unable to create a writing draft');
    } finally {
      setAiLoading(false);
    }
  };

  const exportUrl = (format: string) =>
    `/api/export?username=${encodeURIComponent(profile.username)}&format=${format}&locale=${encodeURIComponent(selectedLocale)}`;
  const embedSnippet = `<iframe src="${typeof window === 'undefined' ? '' : window.location.origin}/embed/${encodeURIComponent(profile.username)}?locale=${encodeURIComponent(selectedLocale)}" title="${profile.username} resume" loading="lazy" referrerpolicy="no-referrer"></iframe>`;

  return (
    <div className="space-y-4">
      <section
        className="space-y-3 rounded border border-border bg-card p-5"
        aria-labelledby="phase5-sharing"
      >
        <p className="text-sm font-medium text-primary">Sharing and data</p>
        <h3 id="phase5-sharing" className="text-2xl font-semibold">
          Exports, embed, and analytics
        </h3>
        <div className="flex flex-wrap gap-2">
          {['txt', 'json', 'docx'].map((format) => (
            <a
              key={format}
              href={exportUrl(format)}
              className="inline-flex min-h-11 items-center rounded border border-border bg-secondary px-3 text-sm transition-colors hover:bg-muted"
            >
              {format} export
            </a>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allowEmbed}
            onChange={(event) => setAllowEmbed(event.target.checked)}
          />
          Allow embeds when this profile is unlisted (public profiles can be
          embedded)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={analyticsEnabled}
            onChange={(event) => setAnalyticsEnabled(event.target.checked)}
          />
          Enable consent-based analytics with 90-day raw retention
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={digestOptIn}
            disabled={!analyticsEnabled}
            onChange={(event) => setDigestOptIn(event.target.checked)}
          />
          Email me a weekly aggregate analytics digest
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void persistSettings()}
          >
            Save settings
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              void navigator.clipboard
                .writeText(embedSnippet)
                .then(() => toast.success('Embed snippet copied'))
            }
          >
            Copy embed snippet
          </Button>
        </div>
      </section>

      <section
        className="space-y-3 rounded border border-border bg-card p-5"
        aria-labelledby="phase5-locales"
      >
        <p className="text-sm font-medium text-primary">
          Languages and translations
        </p>
        <h3 id="phase5-locales" className="text-2xl font-semibold">
          Profile languages
        </h3>
        <p className="text-xs text-muted-foreground">
          Add up to five manual BCP-47 locales. Missing translated fields fall
          back to {defaultLocale}. Access settings are shared, never duplicated.
        </p>
        <div className="flex flex-wrap gap-2">
          <div className="min-w-0 flex-1">
            <label
              className="block text-sm font-medium"
              htmlFor="phase5-selected-locale"
            >
              Profile locale
            </label>
            <select
              id="phase5-selected-locale"
              className={inputClass}
              value={selectedLocale}
              onChange={(event) => setSelectedLocale(event.target.value)}
            >
              {locales.map((locale) => (
                <option key={locale} value={locale}>
                  {locale}
                  {locale === defaultLocale ? ' (default)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label
              className="block text-sm font-medium"
              htmlFor="phase5-new-locale"
            >
              New locale
            </label>
            <input
              id="phase5-new-locale"
              className={inputClass}
              value={newLocale}
              maxLength={35}
              placeholder="fr-CA"
              onChange={(event) => setNewLocale(event.target.value)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!newLocale || locales.length >= 5}
            onClick={() => void addLocale()}
          >
            Add locale
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={selectedLocale === defaultLocale}
            onClick={() => void removeLocale()}
          >
            Remove locale
          </Button>
        </div>
        {selectedLocale === defaultLocale ? (
          <p className="text-sm text-muted-foreground">
            Edit the default locale in the profile fields below.
          </p>
        ) : (
          <>
            <label
              className="block text-sm font-medium"
              htmlFor="translation-overlay"
            >
              Translation overlay
            </label>
            <textarea
              id="translation-overlay"
              className={`${inputClass} min-h-48 font-mono`}
              value={translationJson}
              onChange={(event) => setTranslationJson(event.target.value)}
              aria-describedby="translation-help"
            />
            <p id="translation-help" className="text-xs text-muted-foreground">
              Use text paths such as bio or
              experience.&lt;entry-id&gt;.description and list paths such as
              skills. Links, contact fields, media, IDs, and access settings are
              rejected.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => void persistTranslation()}
            >
              Save translation
            </Button>
          </>
        )}
      </section>

      <section
        className="space-y-3 rounded border border-border bg-card p-5"
        aria-labelledby="phase5-ai"
      >
        <p className="text-sm font-medium text-primary">Writing assistance</p>
        <h3 id="phase5-ai" className="text-2xl font-semibold">
          AI writing drafts
        </h3>
        <p className="text-xs text-muted-foreground">
          Optional AI sends only the selected visible profile text and job
          description. Contact details, social IDs, media, private metadata, and
          imports are excluded. Drafts are untrusted plain text, stay in this
          browser, and are never automatically saved or sent.
        </p>
        {!aiEnabled ? (
          <p className="text-sm text-muted-foreground">
            AI writing is disabled by the site operator.
          </p>
        ) : (
          <>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <label
                  className="block text-sm font-medium"
                  htmlFor="phase5-ai-kind"
                >
                  Draft type
                </label>
                <select
                  id="phase5-ai-kind"
                  className={inputClass}
                  value={aiKind}
                  onChange={(event) =>
                    setAiKind(event.target.value as 'section' | 'cover_letter')
                  }
                >
                  <option value="section">Section suggestion</option>
                  <option value="cover_letter">Cover letter</option>
                </select>
              </div>
              {aiKind === 'section' && (
                <div className="min-w-0 flex-1">
                  <label
                    className="block text-sm font-medium"
                    htmlFor="phase5-ai-section"
                  >
                    Section
                  </label>
                  <select
                    id="phase5-ai-section"
                    className={inputClass}
                    value={aiSection}
                    onChange={(event) =>
                      setAiSection(event.target.value as 'bio' | 'title')
                    }
                  >
                    <option value="bio">Bio</option>
                    <option value="title">Title</option>
                  </select>
                </div>
              )}
            </div>
            <fieldset className="space-y-1">
              <legend className="text-sm font-medium">
                Visible profile text to share
              </legend>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {AI_FIELDS.map((field) => (
                  <label
                    key={field}
                    className="flex items-center gap-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAiFields.includes(field)}
                      onChange={(event) =>
                        setSelectedAiFields((current) =>
                          event.target.checked
                            ? [...current, field]
                            : current.filter((item) => item !== field)
                        )
                      }
                    />
                    {field}
                  </label>
                ))}
              </div>
            </fieldset>
            <label
              className="block text-sm font-medium"
              htmlFor="phase5-job-description"
            >
              Job description
            </label>
            <textarea
              id="phase5-job-description"
              className={`${inputClass} min-h-32`}
              value={jobDescription}
              maxLength={12000}
              placeholder="Paste the job description"
              onChange={(event) => setJobDescription(event.target.value)}
            />
            <Button
              type="button"
              size="sm"
              disabled={
                aiLoading ||
                !jobDescription.trim() ||
                selectedAiFields.length === 0
              }
              onClick={() => void requestDraft()}
            >
              {aiLoading ? 'Creating…' : 'Create draft'}
            </Button>
            {draft && (
              <div className="space-y-2">
                <label htmlFor="ai-draft" className="text-sm font-medium">
                  Review and edit draft
                </label>
                <textarea
                  id="ai-draft"
                  className={`${inputClass} min-h-48`}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                {reviewNotes.length > 0 && (
                  <ul className="list-disc pl-5 text-xs text-muted-foreground">
                    {reviewNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  {aiKind === 'section' && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        form.setValue(aiSection, draft, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      Apply to {aiSection}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void navigator.clipboard
                        .writeText(draft)
                        .then(() => toast.success('Draft copied'))
                    }
                  >
                    Copy draft
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
