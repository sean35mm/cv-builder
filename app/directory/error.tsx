'use client';

import { BrandLockup } from '@/components/platform/brand-lockup';

export default function DirectoryError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto min-h-screen max-w-[88rem] px-4 py-6 sm:px-6 md:py-8 lg:px-10">
      <BrandLockup className="group-data-[workspace-chrome=true]/app-shell:hidden" />
      <div role="alert" className="mt-16 border-y border-border py-8 sm:py-10">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-destructive">
          Directory
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
          The directory could not be loaded
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Please try again to continue exploring public profiles.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 min-h-11 rounded bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
