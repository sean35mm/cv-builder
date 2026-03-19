'use client';

import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion';

const THEME_DOTS = [
  'hsl(150 20% 45%)', // Sage
  'hsl(210 85% 45%)', // Ocean
  'hsl(340 80% 50%)', // Rose
  'hsl(38 92% 50%)', // Amber
  'hsl(222 47% 20%)', // Slate
  'hsl(30 35% 35%)', // Sand
  'hsl(20 35% 30%)', // Cocoa
  'hsl(18 90% 60%)', // Peach
  'hsl(140 35% 30%)', // Forest
  'hsl(90 25% 32%)', // Olive
  'hsl(180 35% 35%)', // Teal
  'hsl(280 25% 45%)', // Mauve
];

type ClosingCTAProps = {
  onSignIn: () => void;
};

export function ClosingCTA({ onSignIn }: ClosingCTAProps) {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 50%, hsl(var(--primary) / 0.06), transparent)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            {/* Decorative theme dots */}
            <div className="mb-10 flex items-center justify-center gap-2">
              {THEME_DOTS.map((color, i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <h2 className="text-4xl font-serif tracking-[-0.01em] text-foreground sm:text-5xl">
              Your experience deserves
              <br />a better home.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Stop sending plain PDFs. Build a personal page that works for you
              around the clock.
            </p>

            <div className="mt-10">
              <Button
                size="lg"
                onClick={onSignIn}
                className="px-10 text-base transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Building
              </Button>
            </div>

            <p className="mt-5 font-mono text-xs tracking-wide text-muted-foreground/70">
              Free forever. No credit card.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
