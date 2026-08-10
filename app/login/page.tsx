'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { SignInForm } from '@/components/sign-in-form';
import { BrandLockup } from '@/components/platform/brand-lockup';
import { api } from '@/convex/_generated/api';

export default function LoginPage() {
  const router = useRouter();
  const loggedInUser = useQuery(api.auth.loggedInUser);

  useEffect(() => {
    if (loggedInUser) {
      router.replace('/home');
    }
  }, [loggedInUser, router]);

  if (loggedInUser === undefined || loggedInUser) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        aria-busy="true"
        aria-label="Opening your home"
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-background px-4 sm:px-6"
      data-route-landmark="authentication"
    >
      <div className="mx-auto max-w-sm py-20">
        <BrandLockup />
        <section
          className="mt-16 border-t border-border pt-8"
          aria-label="Sign in form"
        >
          <span className="block size-2.5 bg-accent" aria-hidden="true" />
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            OpenCV account
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.02em] text-foreground">
            Sign in
          </h1>
          <p className="mb-7 mt-3 text-sm leading-6 text-muted-foreground">
            Use the email connected to your OpenCV profile.
          </p>
          <SignInForm />
        </section>
      </div>
    </main>
  );
}
