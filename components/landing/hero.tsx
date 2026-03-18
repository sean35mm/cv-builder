'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Reveal } from '@/components/motion';
import { UsernameClaim } from './username-claim';

type HeroProps = {
  onSignIn: () => void;
};

const themes = [
  { name: 'Sage', slug: 'sage' },
  { name: 'Ocean', slug: 'ocean' },
  { name: 'Rose', slug: 'rose' },
  { name: 'Slate', slug: 'slate' },
  { name: 'Teal', slug: 'teal' },
  { name: 'Amber', slug: 'amber' },
] as const;

function ProfileMock({ theme }: { theme: string }) {
  return (
    <div
      className={`theme-${theme} rounded-lg border bg-card p-6 text-card-foreground h-full`}
    >
      <div className="mb-5">
        <div className="text-2xl font-serif font-semibold text-foreground">
          Jane Doe
        </div>
        <div className="text-sm text-muted-foreground mt-0.5">
          Product Designer &middot; San Francisco
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Experience
          </div>
          <div className="space-y-2.5">
            <div>
              <div className="text-sm font-medium text-foreground">
                Senior Designer
              </div>
              <div className="text-xs text-muted-foreground">
                Stripe &middot; 2022 &ndash; Present
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">
                Product Designer
              </div>
              <div className="text-xs text-muted-foreground">
                Figma &middot; 2019 &ndash; 2022
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Skills
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['Design Systems', 'Figma', 'Prototyping', 'User Research'].map(
              (s) => (
                <span
                  key={s}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground"
                >
                  {s}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-[11px] text-muted-foreground font-mono">
          opencv.app/@janedoe
        </span>
      </div>
    </div>
  );
}

export function Hero({ onSignIn }: HeroProps) {
  const [activeTheme, setActiveTheme] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    let interval: ReturnType<typeof setInterval>;

    const start = () => {
      interval = setInterval(() => {
        setActiveTheme((i) => (i + 1) % themes.length);
      }, 3000);
    };

    const handleVisibility = () => {
      clearInterval(interval);
      if (!document.hidden) start();
    };

    start();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [reduce]);

  return (
    <section className="relative px-4 pt-32 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_380px] lg:gap-20">
        {/* Left: copy */}
        <div>
          <Reveal delay={0.05}>
            <span className="inline-block rounded-full border px-3 py-1 text-[11px] font-mono tracking-widest text-muted-foreground mb-6">
              BETA
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-4xl font-serif tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl leading-[1.1]">
              Your career,
              <br />
              beautifully presented.
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-5 max-w-md text-base text-muted-foreground leading-relaxed sm:text-lg">
              Build a polished, shareable CV in minutes. Claim your personal URL
              and make a lasting first impression.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-8">
              <UsernameClaim onClaim={onSignIn} />
            </div>
          </Reveal>
        </div>

        {/* Right: rotating theme preview */}
        <Reveal delay={0.25} direction="right" className="hidden lg:block">
          <div className="relative">
            {/* Theme selector dots */}
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-2">
              {themes.map((t, i) => (
                <button
                  key={t.slug}
                  onClick={() => setActiveTheme(i)}
                  aria-label={`Preview ${t.name} theme`}
                  className={`h-2.5 w-2.5 rounded-full border transition-all duration-300 ${
                    i === activeTheme
                      ? 'scale-125 bg-foreground border-foreground'
                      : 'bg-muted-foreground/20 border-muted-foreground/30 hover:bg-muted-foreground/40'
                  }`}
                />
              ))}
            </div>

            {/* Card */}
            <div className="relative h-[420px] w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={themes[activeTheme].slug}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <ProfileMock theme={themes[activeTheme].slug} />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-3 text-center">
              <span className="text-xs text-muted-foreground">
                {themes[activeTheme].name} theme
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
