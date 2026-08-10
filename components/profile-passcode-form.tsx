'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ProfilePasscodeForm({ username }: { username: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/profile-access/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, passcode }),
      });
      setPasscode('');
      if (!response.ok) {
        setError(
          response.status === 429
            ? 'Too many attempts. Please try again later.'
            : 'Unable to unlock this profile.'
        );
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }
      router.refresh();
    } catch {
      setPasscode('');
      setError('Unable to unlock this profile.');
      requestAnimationFrame(() => inputRef.current?.focus());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground sm:px-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-card md:grid-cols-[0.9fr_1.1fr]">
        <header className="flex min-h-56 flex-col justify-end border-b border-border bg-secondary p-7 sm:p-10 md:min-h-[430px] md:border-b-0 md:border-r">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Protected profile
          </p>
          <h1 className="mt-3 max-w-xs font-display text-4xl font-semibold tracking-[-0.02em]">
            This profile is shared privately.
          </h1>
        </header>
        <section
          className="flex flex-col justify-center p-7 sm:p-10 md:p-12"
          aria-label="Profile passcode"
        >
          <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">
            Enter the passcode
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enter the profile passcode to continue.
          </p>
          <form
            onSubmit={(event) => void submit(event)}
            className="mt-6 space-y-4"
          >
            <div>
              <label htmlFor="profile-passcode" className="text-sm font-medium">
                Passcode
              </label>
              <Input
                ref={inputRef}
                id="profile-passcode"
                type="password"
                autoComplete="current-password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                aria-describedby={error ? 'profile-passcode-error' : undefined}
                aria-invalid={Boolean(error)}
                required
                className="mt-1"
              />
            </div>
            {error && (
              <p
                id="profile-passcode-error"
                role="alert"
                className="rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Unlocking…' : 'Unlock profile'}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
