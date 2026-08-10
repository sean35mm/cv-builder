'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, ExternalLink, Loader2, PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import type { Doc } from '@/convex/_generated/dataModel';
import { ProfileShareDialog } from '@/components/profile-share-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  resolveProfileAccessMode,
  type ProfileAccessMode,
} from '@/lib/profile/access';
import { normalizeProfilePasscode } from '@/lib/profile/passcode-policy';

const ACCESS_OPTIONS: Array<{
  mode: ProfileAccessMode;
  label: string;
  summary: string;
}> = [
  {
    mode: 'private',
    label: 'Private',
    summary:
      'Only you can access the profile. Visitor profile, PDF, contact, and analytics access is disabled.',
  },
  {
    mode: 'passcode',
    label: 'Passcode protected',
    summary:
      'Visitors need your passcode. The profile stays out of the directory and asks search engines not to index it.',
  },
  {
    mode: 'unlisted',
    label: 'Unlisted',
    summary:
      'Anyone with the direct link can view it. It stays out of the directory and asks search engines not to index it.',
  },
  {
    mode: 'public',
    label: 'Public',
    summary:
      'Anyone can view it. The profile is eligible for the public directory and search indexing.',
  },
];

const ACCESS_STATUS = Object.fromEntries(
  ACCESS_OPTIONS.map(({ mode, label, summary }) => [mode, { label, summary }])
) as Record<ProfileAccessMode, { label: string; summary: string }>;

type Feedback = {
  tone: 'neutral' | 'success' | 'error';
  message: string;
};

export function PublishLoading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center"
      aria-busy="true"
      aria-label="Loading publish workspace"
    >
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </main>
  );
}

export function PublishWithoutProfile() {
  return (
    <main
      className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6 md:py-12"
      data-route-landmark="publish-no-profile"
    >
      <section
        className="border-y border-border py-8 sm:py-12"
        aria-labelledby="publish-start-title"
      >
        <h1
          id="publish-start-title"
          className="font-display text-4xl font-semibold tracking-[-0.02em] sm:text-5xl"
        >
          Create your profile before publishing
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Your profile address and access controls will appear here.
        </p>
        <Button asChild className="mt-7">
          <Link href="/editor">Create profile</Link>
        </Button>
      </section>
    </main>
  );
}

export function PublishWorkspace({ profile }: { profile: Doc<'profiles'> }) {
  const initialMode = resolveProfileAccessMode(
    profile.isPublic,
    profile.isDirectoryListed,
    profile.accessMode
  );
  const profileHref = `/@${profile.username}`;
  const [currentMode, setCurrentMode] =
    useState<ProfileAccessMode>(initialMode);
  const [canonicalUrl, setCanonicalUrl] = useState(profileHref);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setCanonicalUrl(new URL(profileHref, window.location.origin).toString());
  }, [profileHref]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      toast.success('Profile address copied');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Unable to copy profile address');
    }
  };

  const isAvailable = currentMode !== 'private';
  const status = ACCESS_STATUS[currentMode];

  return (
    <main
      className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 md:py-12"
      data-route-landmark="publish"
    >
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
            Publish
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage your profile address, access, sharing, and exports.
          </p>
        </div>
        <div>
          <Button asChild variant="outline">
            <Link href="/editor">
              <PencilLine aria-hidden="true" />
              Edit profile
            </Link>
          </Button>
        </div>
      </header>

      <section
        className="border-y border-border py-6 sm:py-8"
        aria-labelledby="profile-address-title"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Profile address
            </p>
            <h2
              id="profile-address-title"
              className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em]"
            >
              /@{profile.username}
            </h2>
            <p className="mt-2 break-all font-mono text-sm text-muted-foreground">
              {canonicalUrl}
            </p>
            {isAvailable ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void copyAddress()}
                >
                  {copied ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <Copy aria-hidden="true" />
                  )}
                  {copied ? 'Copied' : 'Copy address'}
                </Button>
                <ProfileShareDialog
                  username={profile.username}
                  canonicalUrl={canonicalUrl}
                />
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                The address is reserved, but visitor access and sharing are off
                while the profile is private.
              </p>
            )}
          </div>
          <div className="rounded border border-border p-5">
            <p className="text-sm font-medium text-muted-foreground">
              Current access
            </p>
            <div className="mt-2">
              <h2 className="text-xl font-semibold" role="status">
                {status.label}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {status.summary}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6 space-y-6">
        <PublishAccessControl
          currentMode={currentMode}
          onModeChange={setCurrentMode}
        />
        <PublishActions
          username={profile.username}
          profileHref={profileHref}
          available={isAvailable}
        />
      </div>
    </main>
  );
}

export function PublishAccessControl({
  currentMode,
  onModeChange,
}: {
  currentMode: ProfileAccessMode;
  onModeChange?: (mode: ProfileAccessMode) => void;
}) {
  const [selectedMode, setSelectedMode] =
    useState<ProfileAccessMode>(currentMode);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    setSelectedMode(currentMode);
  }, [currentMode]);

  const updateAccess = async () => {
    if (selectedMode === 'passcode') {
      try {
        normalizeProfilePasscode(passcode);
      } catch {
        setPasscodeError(
          'Use 10–128 characters without control or formatting characters.'
        );
        return;
      }
    }

    setPasscodeError(null);
    setSubmitting(true);
    setFeedback({ tone: 'neutral', message: 'Updating profile access…' });
    try {
      const response = await fetch('/api/profile-access/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedMode,
          ...(selectedMode === 'passcode' ? { passcode } : {}),
        }),
      });
      if (!response.ok) throw new Error('Unable to update profile access');

      setPasscode('');
      onModeChange?.(selectedMode);
      setFeedback({
        tone: 'success',
        message: `Profile access is now ${ACCESS_STATUS[selectedMode].label.toLowerCase()}.`,
      });
      toast.success('Profile access updated');
    } catch {
      setPasscode('');
      setFeedback({
        tone: 'error',
        message: 'Unable to update profile access. Please try again.',
      });
      toast.error('Unable to update profile access');
    } finally {
      setSubmitting(false);
    }
  };

  const revokeAccess = async () => {
    setSubmitting(true);
    setFeedback({ tone: 'neutral', message: 'Revoking unlocked browsers…' });
    try {
      const response = await fetch('/api/profile-access/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!response.ok) throw new Error('Unable to revoke profile access');

      setFeedback({
        tone: 'success',
        message: 'Previously unlocked browsers must enter the passcode again.',
      });
      toast.success('Unlocked browsers revoked');
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Unable to revoke unlocked browsers. Please try again.',
      });
      toast.error('Unable to revoke profile access');
    } finally {
      setSubmitting(false);
    }
  };

  const unchanged = selectedMode === currentMode && selectedMode !== 'passcode';

  return (
    <section
      className="border-t border-border pt-8"
      aria-labelledby="access-control-title"
      aria-busy={submitting}
    >
      <p className="text-sm font-medium text-muted-foreground">
        Access controls
      </p>
      <h2
        id="access-control-title"
        className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em]"
      >
        Choose who can open your profile
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Select an access mode for the saved profile.
      </p>

      <fieldset
        className="mt-6 grid gap-3 sm:grid-cols-2"
        disabled={submitting}
      >
        <legend className="sr-only">Profile access mode</legend>
        {ACCESS_OPTIONS.map((option) => (
          <label
            key={option.mode}
            className={`flex min-h-36 cursor-pointer gap-3 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-ring ${
              selectedMode === option.mode
                ? 'border-foreground bg-card'
                : 'border-border bg-card hover:bg-secondary'
            }`}
          >
            <input
              type="radio"
              name="publish-access-mode"
              value={option.mode}
              checked={selectedMode === option.mode}
              onChange={() => {
                setSelectedMode(option.mode);
                setPasscode('');
                setPasscodeError(null);
                setFeedback(null);
              }}
              className="mt-1 size-4 shrink-0 accent-[hsl(var(--accent))]"
            />
            <span>
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                {option.summary}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {selectedMode === 'passcode' && (
        <div className="mt-4 rounded border border-border bg-secondary p-5 sm:flex sm:items-start sm:gap-4">
          <div className="sm:flex-1">
            <label htmlFor="publish-passcode" className="text-sm font-medium">
              {currentMode === 'passcode' ? 'New passcode' : 'Passcode'}
            </label>
            <Input
              id="publish-passcode"
              type="password"
              autoComplete="new-password"
              value={passcode}
              onChange={(event) => {
                setPasscode(event.target.value);
                setPasscodeError(null);
              }}
              disabled={submitting}
              aria-invalid={Boolean(passcodeError)}
              aria-describedby={
                passcodeError
                  ? 'publish-passcode-help publish-passcode-error'
                  : 'publish-passcode-help'
              }
              className="mt-2 bg-background"
            />
            <p
              id="publish-passcode-help"
              className="mt-2 text-xs text-muted-foreground"
            >
              Use 10–128 characters. Spaces are preserved.
            </p>
            {passcodeError && (
              <p
                id="publish-passcode-error"
                className="mt-2 text-sm text-destructive"
              >
                {passcodeError}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void updateAccess()}
          disabled={
            submitting ||
            unchanged ||
            (selectedMode === 'passcode' && passcode.length === 0)
          }
        >
          {submitting && (
            <Loader2 aria-hidden="true" className="animate-spin" />
          )}
          {submitting
            ? 'Updating…'
            : currentMode === 'passcode' && selectedMode === 'passcode'
              ? 'Change passcode'
              : 'Apply access mode'}
        </Button>
        {currentMode === 'passcode' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void revokeAccess()}
            disabled={submitting}
          >
            Revoke unlocked browsers
          </Button>
        )}
      </div>
      <p
        className={`mt-4 min-h-5 text-sm ${
          feedback?.tone === 'error'
            ? 'text-destructive'
            : feedback?.tone === 'success'
              ? 'text-foreground'
              : 'text-muted-foreground'
        }`}
        role="status"
        aria-live="polite"
      >
        {feedback?.message}
      </p>
    </section>
  );
}

function PublishActions({
  username,
  profileHref,
  available,
}: {
  username: string;
  profileHref: string;
  available: boolean;
}) {
  const pdfHref = `/api/pdf?username=${encodeURIComponent(username)}`;

  return (
    <section
      className="border-t border-border pt-8"
      aria-labelledby="publish-actions-title"
    >
      <h2 id="publish-actions-title" className="text-xl font-semibold">
        Share and export
      </h2>
      <div className="mt-5 divide-y divide-border border-y border-border">
        {available ? (
          <>
            <ActionLink href={profileHref} label="Preview profile" external />
            <ActionLink href={pdfHref} label="Download PDF" external />
          </>
        ) : (
          <div className="py-4">
            <p className="text-sm font-medium">Preview and PDF unavailable</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Choose passcode, unlisted, or public access to use these links.
            </p>
          </div>
        )}
        <ActionLink href="/domains" label="Custom domain" />
      </div>
    </section>
  );
}

function ActionLink({
  href,
  label,
  external = false,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex min-h-12 items-center justify-between gap-4 px-1 py-3 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span>{label}</span>
      {external && (
        <ExternalLink
          aria-hidden="true"
          className="h-4 w-4 text-muted-foreground"
        />
      )}
    </Link>
  );
}
