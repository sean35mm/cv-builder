'use client';

import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import Link from 'next/link';

export function ClosingCTA({ onSignIn }: { onSignIn: () => void }) {
  return (
    <section className="border-b border-border" aria-labelledby="closing-title">
      <div className="mx-auto grid max-w-[88rem] gap-10 px-4 py-24 sm:px-6 md:py-32 lg:grid-cols-12 lg:px-10">
        <Reveal className="lg:col-span-5 lg:col-start-2">
          <h2
            id="closing-title"
            className="font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl"
          >
            Make the address yours.
          </h2>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-4 lg:col-start-8">
          <p className="max-w-md text-base leading-7 text-muted-foreground">
            Claim your username, add the work that matters, and publish when the
            profile is ready.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={onSignIn}
              size="lg"
              className="whitespace-nowrap"
            >
              Claim your address
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/directory" className="whitespace-nowrap">
                Browse profiles
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
