'use client';

import { Check, Copy, Download, ExternalLink } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProfileAccessMode } from '@/lib/profile/access';
import { normalizeProfilePasscode } from '@/lib/profile/passcode-policy';
import { cn } from '@/lib/utils';

const ACCESS_OPTIONS: Array<{
  mode: ProfileAccessMode;
  label: string;
  hint: string;
}> = [
  {
    mode: 'public',
    label: 'Public',
    hint: 'Anyone can view it. Listed in the directory and search engines.',
  },
  {
    mode: 'unlisted',
    label: 'Unlisted',
    hint: 'Anyone with the link can view it. Not listed or indexed.',
  },
  {
    mode: 'private',
    label: 'Private',
    hint: 'Only you can see it.',
  },
  {
    mode: 'passcode',
    label: 'Passcode',
    hint: 'Visitors enter a passcode first. Not listed or indexed.',
  },
];

type Feedback = { tone: 'error' | 'success'; message: string } | null;

const postAccess = async (
  path: '/api/profile-access/configure' | '/api/profile-access/revoke',
  body: object
) => {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.status === 429) {
    throw new Error('Too many changes. Wait a minute and try again.');
  }
  if (!response.ok) throw new Error("Couldn't update access. Try again.");
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Couldn't update access. Try again.";

export function ShareDialog({
  open,
  onOpenChange,
  username,
  profileUrl,
  displayUrl,
  accessMode,
  runAccessChange,
  onAccessChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  profileUrl: string;
  displayUrl: string;
  accessMode: ProfileAccessMode;
  runAccessChange: (task: () => Promise<void>) => Promise<void>;
  onAccessChanged: (mode: ProfileAccessMode) => void;
}) {
  const [selected, setSelected] = useState(accessMode);
  const [syncedMode, setSyncedMode] = useState(accessMode);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [copied, setCopied] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);

  // Follow the server once it confirms a change (or another tab makes one).
  if (accessMode !== syncedMode) {
    setSyncedMode(accessMode);
    setSelected(accessMode);
    setQrFailed(false);
  }

  const encodedUsername = encodeURIComponent(username);
  const qrPath = `/api/profile-share/qr?username=${encodedUsername}`;
  const isVisible = accessMode !== 'private';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setFeedback({ tone: 'error', message: "Couldn't copy the link." });
    }
  };

  const configure = async (mode: ProfileAccessMode, code?: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      // No content save may run until the new mode is what saves send, or
      // it would write the old access flags back.
      await runAccessChange(async () => {
        await postAccess('/api/profile-access/configure', {
          mode,
          ...(mode === 'passcode' ? { passcode: code } : {}),
        });
        onAccessChanged(mode);
      });
      return true;
    } catch (error) {
      setFeedback({ tone: 'error', message: errorMessage(error) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const choose = (mode: ProfileAccessMode) => {
    setSelected(mode);
    setFeedback(null);
    setPasscodeError(null);
    if (mode === 'passcode' || mode === accessMode) return;
    void configure(mode).then((ok) => {
      if (!ok) setSelected(accessMode);
    });
  };

  const submitPasscode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      normalizeProfilePasscode(passcode);
    } catch {
      setPasscodeError('Use 10–128 characters.');
      return;
    }
    const ok = await configure('passcode', passcode);
    setPasscode('');
    if (ok) setFeedback({ tone: 'success', message: 'Passcode saved.' });
  };

  const revoke = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await postAccess('/api/profile-access/revoke', {});
      setFeedback({
        tone: 'success',
        message: 'Everyone has to enter the passcode again.',
      });
    } catch (error) {
      setFeedback({ tone: 'error', message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-[440px]">
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle>Share profile</DialogTitle>
          <DialogDescription className="sr-only">
            Copy your profile link and choose who can see it.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5 px-5 pb-5">
          <Input
            readOnly
            value={displayUrl}
            aria-label="Profile link"
            onFocus={(event) => event.currentTarget.select()}
            className="font-mono text-[12.5px] sm:text-[12.5px]"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={copied ? 'Copied' : 'Copy link'}
            onClick={() => void copy()}
          >
            {copied ? (
              <Check className="text-success" aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
          </Button>
          <Button asChild variant="outline" size="icon">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open profile in a new tab"
            >
              <ExternalLink aria-hidden="true" />
            </a>
          </Button>
        </div>

        <fieldset
          className="border-t border-border px-5 py-4"
          disabled={busy}
          aria-busy={busy}
        >
          <legend className="sr-only">Who can see your profile</legend>
          <p
            aria-hidden="true"
            className="mb-2 text-[12px] font-medium text-muted-foreground"
          >
            Who can see it
          </p>
          <div className="space-y-0.5">
            {ACCESS_OPTIONS.map((option) => (
              <label
                key={option.mode}
                className={cn(
                  '-mx-2 flex cursor-pointer gap-2.5 rounded-md px-2 py-2 transition-colors duration-150 ease-out hover:bg-secondary/60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring has-[:disabled]:cursor-default',
                  selected === option.mode && 'bg-secondary/60'
                )}
              >
                <input
                  type="radio"
                  name="access-mode"
                  value={option.mode}
                  checked={selected === option.mode}
                  onChange={() => choose(option.mode)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 rounded-full border border-border-strong bg-surface transition-[border-width,border-color] duration-150 ease-out peer-checked:border-4 peer-checked:border-foreground"
                />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-foreground">
                    {option.label}
                  </span>
                  <span className="block text-[12px] leading-[18px] text-muted-foreground">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {selected === 'passcode' && (
          <form
            onSubmit={(event) => void submitPasscode(event)}
            className="space-y-1.5 px-5 pb-4"
            noValidate
          >
            <Label htmlFor="share-passcode">
              {accessMode === 'passcode' ? 'New passcode' : 'Passcode'}
            </Label>
            <div className="flex gap-1.5">
              <Input
                id="share-passcode"
                type="password"
                autoComplete="new-password"
                value={passcode}
                disabled={busy}
                aria-invalid={Boolean(passcodeError)}
                aria-describedby="share-passcode-hint"
                onChange={(event) => {
                  setPasscode(event.target.value);
                  setPasscodeError(null);
                }}
              />
              <Button type="submit" disabled={busy || passcode.length === 0}>
                {accessMode === 'passcode' ? 'Change' : 'Set passcode'}
              </Button>
            </div>
            <p
              id="share-passcode-hint"
              className={cn(
                'text-[12px]',
                passcodeError ? 'text-destructive' : 'text-subtle'
              )}
            >
              {passcodeError ??
                '10–128 characters. Share it only with people you trust.'}
            </p>
            {accessMode === 'passcode' && (
              <Button
                type="button"
                variant="link"
                className="text-[12px] text-muted-foreground"
                disabled={busy}
                onClick={() => void revoke()}
              >
                Sign out everyone who has unlocked it
              </Button>
            )}
          </form>
        )}

        <p
          role="status"
          aria-live="polite"
          className={cn(
            'px-5 text-[12px]',
            feedback && 'pb-4',
            feedback?.tone === 'error' ? 'text-destructive' : 'text-success'
          )}
        >
          {feedback?.message}
        </p>

        <div className="flex items-center gap-4 border-t border-border px-5 py-4">
          {isVisible ? (
            <>
              <div className="flex size-[88px] shrink-0 items-center justify-center rounded-md border border-border bg-white p-1.5">
                {qrFailed ? (
                  <span className="px-1 text-center text-[11px] leading-4 text-neutral-500">
                    QR code unavailable
                  </span>
                ) : (
                  <img
                    src={`${qrPath}&format=svg`}
                    alt={`QR code for ${displayUrl}`}
                    width={76}
                    height={76}
                    onError={() => setQrFailed(true)}
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-col items-start gap-0.5">
                <Button asChild variant="ghost" size="sm" className="-ml-2.5">
                  <a href={`/api/pdf?username=${encodedUsername}`} download>
                    <Download aria-hidden="true" />
                    Download PDF
                  </a>
                </Button>
                {!qrFailed && (
                  <Button asChild variant="ghost" size="sm" className="-ml-2.5">
                    <a href={`${qrPath}&format=png&download=1`} download>
                      <Download aria-hidden="true" />
                      Download QR code
                    </a>
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p className="text-[12px] text-muted-foreground">
              The QR code and PDF are available once your profile isn&apos;t
              private.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
