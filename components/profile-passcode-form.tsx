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
    <main className="platform-page min-h-screen bg-background text-foreground">
      <div className="platform-grid items-start gap-y-10 pt-12 md:pt-24">
        <header className="col-span-12 md:col-span-5">
          <p className="platform-kicker text-muted-foreground">
            Private edition / Access
          </p>
          <h1 className="mt-4 font-serif text-4xl font-normal tracking-[-0.03em]">
            Protected profile
          </h1>
        </header>
        <section
          className="col-span-12 border-y py-8 md:col-span-5 md:col-start-8"
          aria-label="Profile passcode"
        >
          <p className="mt-2 text-sm text-muted-foreground">
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
                className="text-sm text-destructive"
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
