'use client';

import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion';

type ClosingCTAProps = {
  onSignIn: () => void;
};

export function ClosingCTA({ onSignIn }: ClosingCTAProps) {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-8 h-px w-16 bg-border" />
            <h2 className="text-3xl font-serif tracking-[-0.01em] text-foreground sm:text-4xl">
              Your experience deserves
              <br />a better home.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Stop sending plain PDFs. Build a personal page that works for you
              around the clock.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                onClick={onSignIn}
                className="px-8 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Building
              </Button>
            </div>
            <div className="mx-auto mt-8 h-px w-16 bg-border" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
