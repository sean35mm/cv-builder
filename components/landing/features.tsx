'use client';

import { Reveal } from '@/components/motion';
import { GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';

const SECTIONS = [
  { label: 'Experience', accent: 'bg-primary/20' },
  { label: 'Education', accent: 'bg-primary/15' },
  { label: 'Skills', accent: 'bg-primary/10' },
  { label: 'Projects', accent: 'bg-primary/10' },
];

const THEMES = [
  { name: 'Sage', color: 'hsl(150 20% 45%)' },
  { name: 'Ocean', color: 'hsl(210 85% 45%)' },
  { name: 'Rose', color: 'hsl(340 80% 50%)' },
  { name: 'Amber', color: 'hsl(38 92% 50%)' },
  { name: 'Slate', color: 'hsl(222 47% 20%)' },
  { name: 'Sand', color: 'hsl(30 35% 35%)' },
  { name: 'Cocoa', color: 'hsl(20 35% 30%)' },
  { name: 'Peach', color: 'hsl(18 90% 60%)' },
  { name: 'Forest', color: 'hsl(140 35% 30%)' },
  { name: 'Olive', color: 'hsl(90 25% 32%)' },
  { name: 'Teal', color: 'hsl(180 35% 35%)' },
  { name: 'Mauve', color: 'hsl(280 25% 45%)' },
];

export function Features() {
  return (
    <section className="bg-card py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-14 max-w-md">
            <h2 className="text-2xl font-serif tracking-[-0.01em] text-foreground sm:text-3xl">
              Everything you need,
              <br />
              nothing you don&apos;t.
            </h2>
          </div>
        </Reveal>

        {/* Bento grid — 2 cols on lg, stacked on mobile */}
        <div className="grid gap-4 lg:grid-cols-2 lg:grid-rows-2">
          {/* Card A — Guided Editor (tall left, spans 2 rows) */}
          <Reveal delay={0.1} className="lg:row-span-2">
            <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-background p-8">
              <h3 className="text-lg font-medium text-foreground">
                Guided Editor
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Drag to reorder, edit inline, see changes live. No design
                experience needed.
              </p>

              {/* Mini editor mockup */}
              <div className="relative mt-8 flex flex-1 flex-col gap-2.5">
                {SECTIONS.map((s, i) => (
                  <motion.div
                    key={s.label}
                    className={
                      'flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-shadow ' +
                      (i === 1
                        ? 'relative z-10 shadow-lg ring-1 ring-primary/20'
                        : '')
                    }
                    whileHover={i === 1 ? { x: 6, scale: 1.02 } : undefined}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${s.accent}`}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {s.label}
                    </span>
                    <div className="ml-auto h-1.5 w-12 rounded-full bg-muted" />
                  </motion.div>
                ))}
                {/* Fade at bottom to suggest scrollable list */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
              </div>
            </div>
          </Reveal>

          {/* Card B — 12 Themes (top right) */}
          <Reveal delay={0.15}>
            <div className="group rounded-xl border bg-background p-8">
              <h3 className="text-lg font-medium text-foreground">
                12 Color Themes
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Curated palettes with light &amp; dark modes. Every profile
                feels personal.
              </p>

              {/* Theme dot grid */}
              <div className="mt-6 grid grid-cols-6 gap-3">
                {THEMES.map((t) => (
                  <div key={t.name} className="group/dot flex justify-center">
                    <motion.div
                      className="h-6 w-6 rounded-full ring-1 ring-border/50"
                      style={{ backgroundColor: t.color }}
                      whileHover={{ scale: 1.35 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 15,
                      }}
                      title={t.name}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Card C — Shareable Link (bottom right) */}
          <Reveal delay={0.2}>
            <div className="group rounded-xl border bg-background p-8">
              <h3 className="text-lg font-medium text-foreground">
                Shareable Link
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A clean URL you can put anywhere &mdash; LinkedIn, emails, or
                your portfolio.
              </p>

              {/* Mini browser bar mockup */}
              <div className="mt-6 overflow-hidden rounded-lg border bg-card">
                <div className="flex items-center gap-2 border-b px-3 py-2">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-border" />
                    <div className="h-2 w-2 rounded-full bg-border" />
                    <div className="h-2 w-2 rounded-full bg-border" />
                  </div>
                  <div className="flex-1 rounded-md bg-muted/50 px-3 py-1 text-center">
                    <span className="font-mono text-xs text-muted-foreground">
                      opencv.app/
                    </span>
                    <span className="font-mono text-xs text-primary">
                      @janedoe
                    </span>
                    <motion.span
                      className="ml-px inline-block h-3.5 w-px bg-primary"
                      animate={{ opacity: [1, 0] }}
                      transition={{
                        repeat: Infinity,
                        repeatType: 'reverse',
                        duration: 0.6,
                        ease: 'easeInOut',
                      }}
                    />
                  </div>
                </div>
                {/* Mini page preview lines */}
                <div className="space-y-2 p-4">
                  <div className="h-2 w-24 rounded bg-primary/15" />
                  <div className="h-2 w-36 rounded bg-muted" />
                  <div className="h-2 w-28 rounded bg-muted" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
