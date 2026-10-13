'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { Brand } from '@/components/brand';
import {
  UsernameField,
  UsernameStatus,
  useUsernameAvailability,
} from '@/components/onboarding/username-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/convex/_generated/api';
import { cleanUsernameInput } from '@/lib/username';

const DESIRED_USERNAME_KEY = 'desiredUsername';

const subscribeNever = () => () => {};

function readClaim(): string {
  try {
    return cleanUsernameInput(
      sessionStorage.getItem(DESIRED_USERNAME_KEY) ?? ''
    );
  } catch {
    return '';
  }
}

// Dev deployments include the thrown message after "Uncaught Error:";
// production redacts it, so fall back to a generic line.
function serverMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : '';
  return /Uncaught Error: (.+)/.exec(message)?.[1]?.trim() || fallback;
}

// Shown when a signed-in user has no profile. getMyProfile is reactive, so a
// successful createProfile swaps this out without navigation.
export function Onboarding() {
  const createProfile = useMutation(api.profiles.createProfile);
  const { signOut } = useAuthActions();
  // Prefilled from the landing-page claim; hydration-safe because the server
  // snapshot is empty.
  const claimed = useSyncExternalStore(subscribeNever, readClaim, () => '');
  const [edited, setEdited] = useState<string | null>(null);
  const username = edited ?? claimed;
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = useUsernameAvailability(username);

  const canSubmit = state === 'available' && name.trim() !== '' && !pending;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setEdited(username); // pin it: the claim is cleared on success
    setError(null);
    setPending(true);
    try {
      await createProfile({
        username,
        name: name.trim(),
        title: title.trim() || undefined,
      });
      try {
        sessionStorage.removeItem(DESIRED_USERNAME_KEY);
      } catch {
        // Nothing to clean up.
      }
    } catch (err) {
      setError(serverMessage(err, 'Could not create your profile. Try again.'));
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 items-center justify-between px-5 sm:px-8">
        <Brand />
        <Button variant="ghost" size="sm" onClick={() => void signOut()}>
          Sign out
        </Button>
      </header>

      <div className="flex flex-1 items-start justify-center px-5 pb-16 pt-10 sm:items-center sm:pt-0">
        <section
          aria-labelledby="onboarding-title"
          className="w-full max-w-[420px] rounded-lg border border-border bg-surface p-6 sm:p-8"
        >
          <h1
            id="onboarding-title"
            className="font-serif text-3xl font-normal tracking-[-0.02em]"
          >
            Claim your address
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
            Your profile lives here. The username can&apos;t be changed later;
            everything else can.
          </p>

          <form
            className="mt-7 space-y-5"
            onSubmit={(event) => void submit(event)}
            aria-busy={pending}
          >
            <div className="space-y-2">
              <Label htmlFor="onboarding-username">Username</Label>
              <UsernameField
                id="onboarding-username"
                statusId="onboarding-username-status"
                value={username}
                onValueChange={(value) => {
                  setEdited(value);
                  setError(null);
                }}
                state={state}
              />
              <UsernameStatus
                id="onboarding-username-status"
                username={username}
                state={state}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="onboarding-name">Name</Label>
              <Input
                id="onboarding-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={120}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="onboarding-title-field">
                Headline
                <span className="font-normal text-subtle">Optional</span>
              </Label>
              <Input
                id="onboarding-title-field"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Product designer at Studio North"
                maxLength={120}
                className="h-10"
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="text-[13px] leading-5 text-destructive"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!canSubmit}
            >
              {pending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              Create profile
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
