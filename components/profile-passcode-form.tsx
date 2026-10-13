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
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16 text-foreground">
      <div className="w-full max-w-[20rem]">
        <p className="font-mono text-[12px] text-muted-foreground">
          {username}
        </p>
        <h1 className="mt-2 text-[17px] font-semibold tracking-[-0.01em]">
          This profile is private
        </h1>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
          Enter the passcode you were given to view it.
        </p>
        <form
          onSubmit={(event) => void submit(event)}
          className="mt-6 space-y-3"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="profile-passcode"
              className="text-[13px] font-medium"
            >
              Passcode
            </label>
            <Input
              ref={inputRef}
              id="profile-passcode"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              aria-describedby={error ? 'profile-passcode-error' : undefined}
              aria-invalid={Boolean(error)}
              required
            />
          </div>
          {error && (
            <p
              id="profile-passcode-error"
              role="alert"
              className="text-[13px] leading-5 text-destructive"
            >
              {error}
            </p>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Unlocking…' : 'Unlock'}
          </Button>
        </form>
      </div>
    </main>
  );
}
