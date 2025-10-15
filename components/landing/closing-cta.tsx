'use client';

import { Button } from '@/components/ui/button';
import { motion, useReducedMotion } from 'framer-motion';

interface ClosingCTAProps {
  onSignIn: () => void;
}

export function ClosingCTA({ onSignIn }: ClosingCTAProps) {
  const reduce = useReducedMotion();

  return (
    <section className="relative py-24">
      {/* gradient spotlight background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 -top-32 mx-auto h-72 w-[56rem] rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,hsla(var(--primary),0.25),transparent_70%)] blur-3xl" />
        <div className="absolute inset-x-0 -bottom-24 mx-auto h-64 w-[40rem] rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,hsla(var(--accent),0.22),transparent_70%)] blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 12 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={reduce ? undefined : { once: true, amount: 0.2 }}
          transition={reduce ? undefined : { duration: 0.45 }}
          className="rounded-3xl p-[1px] bg-[linear-gradient(135deg,hsla(var(--primary),0.45),hsla(var(--accent),0.45)_50%,transparent)]"
        >
          <div className="rounded-3xl bg-primary/10 backdrop-blur-xl border border-white/10 px-6 md:px-12 py-12 shadow-[0_30px_80px_-30px_rgba(2,6,23,0.6)]">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join Thousands of Professionals
            </h2>
            <p className="text-lg md:text-xl mb-8 text-foreground/90">
              Over 50% of hiring managers prefer candidates with personal
              websites. Take the edge.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={onSignIn}
                className="text-lg px-8 py-3"
              >
                Start Building Your CV
              </Button>
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="text-lg px-8 py-3"
              >
                <a href="/@sample" target="_blank" rel="noopener noreferrer">
                  See Examples
                </a>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500/80" />
                Trusted by candidates worldwide
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary/70" />
                Mobile-optimized, lightning fast
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent/70" />
                Privacy-first
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
