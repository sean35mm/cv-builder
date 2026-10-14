'use client';

import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  UsernameField,
  UsernameStatus,
  useUsernameAvailability,
} from '@/components/onboarding/username-field';
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';

export function UsernameClaim() {
  const router = useRouter();
  const user = useQuery(api.auth.loggedInUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState('');
  const state = useUsernameAvailability(username);

  // Visitors from a profile's "Made with OpenCV" link came to claim one.
  // Skipped on touch screens, where focusing would pop the keyboard.
  useEffect(() => {
    const fromProfile =
      new URLSearchParams(window.location.search).get('ref') === 'profile';
    if (fromProfile && window.matchMedia('(pointer: fine)').matches) {
      inputRef.current?.focus();
    }
  }, []);

  const claim = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state !== 'available') {
      inputRef.current?.focus();
      return;
    }
    try {
      sessionStorage.setItem('desiredUsername', username);
    } catch {
      // Storage can be blocked; onboarding then starts empty.
    }
    router.push(user ? '/editor' : '/login');
  };

  return (
    <form onSubmit={claim} className="w-full max-w-[28rem]">
      <label htmlFor="claim-username" className="sr-only">
        Choose a username
      </label>
      <UsernameField
        id="claim-username"
        statusId="claim-username-status"
        size="lg"
        value={username}
        onValueChange={setUsername}
        state={state}
        inputRef={inputRef}
      >
        <Button type="submit" className="h-9 px-3.5 font-sans">
          Claim
        </Button>
      </UsernameField>
      <UsernameStatus
        id="claim-username-status"
        username={username}
        state={state}
        className="mt-2.5"
      />
    </form>
  );
}

// Sends visitors further down the page back to the hero's claim field.
export function ClaimJump({ className }: { className?: string }) {
  const jump = () => {
    const input = document.getElementById('claim-username');
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input?.focus({ preventScroll: true });
  };

  return (
    <Button type="button" size="lg" onClick={jump} className={className}>
      Claim your username
    </Button>
  );
}
