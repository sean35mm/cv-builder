'use client';

import { UsernameClaim } from './username-claim';
import { HeroSpecimen } from './hero-specimen';
import { Reveal } from '@/components/motion/reveal';

export function Hero({ onSignIn }: { onSignIn: () => void }) {
  return (
    <section className="relative min-h-[100dvh]" aria-labelledby="cover-title">
      <div className="mx-auto grid min-h-[100dvh] max-w-[88rem] items-center gap-10 px-4 pb-12 pt-20 sm:px-6 md:pt-24 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16 lg:px-10">
        <Reveal direction="right" className="max-w-xl">
          <div>
            <h1
              id="cover-title"
              className="font-display text-4xl font-semibold leading-[0.98] tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl"
            >
              <span className="block">Your work.</span>
              <span className="block">One address.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
              Build a professional profile, choose who sees it, and publish at{' '}
              <span className="font-mono text-foreground">opencv.app/@you</span>
              .
            </p>

            <div className="mt-8">
              <UsernameClaim onClaim={onSignIn} />
            </div>
          </div>
        </Reveal>

        <Reveal direction="left" delay={0.08}>
          <div>
            <HeroSpecimen />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
