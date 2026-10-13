'use client';

import { useQuery } from 'convex/react';
import Link from 'next/link';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';

export function LandingHeader() {
  const user = useQuery(api.auth.loggedInUser);

  return (
    <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
      <Brand />
      <nav aria-label="Account" className="flex items-center gap-1.5">
        {user ? (
          <Button asChild size="sm">
            <Link href="/editor">Open editor</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Get started</Link>
            </Button>
          </>
        )}
      </nav>
    </header>
  );
}
