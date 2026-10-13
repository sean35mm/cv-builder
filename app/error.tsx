'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col px-5">
      <header className="flex h-14 items-center sm:px-3">
        <Brand />
      </header>
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center pb-24">
        <h1 className="font-serif text-4xl font-normal tracking-[-0.025em]">
          Something went wrong.
        </h1>
        <p className="mt-3 text-[14px] leading-6 text-muted-foreground">
          This page hit an error while loading. Trying again usually fixes it.
        </p>
        <div className="mt-8 flex items-center gap-2">
          <Button size="lg" onClick={reset}>
            Try again
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/">Go home</Link>
          </Button>
        </div>
        {error.digest ? (
          <p className="mt-8 font-mono text-[12px] text-subtle">
            Reference {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
