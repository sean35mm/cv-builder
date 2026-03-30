'use client';

import { useState } from 'react';
import { Reveal } from '@/components/motion';
import {
  BarChart3,
  Copy,
  GripVertical,
  Layout,
  MessageCircle,
  Plus,
} from 'lucide-react';
import { motion } from 'framer-motion';

/* ── Data ── */

const SECTIONS = [
  { label: 'Experience', active: false },
  { label: 'Education', active: true },
  { label: 'Skills', active: false },
  { label: 'Projects', active: false },
];

const THEMES = [
  { name: 'Sage', hsl: '150 20% 45%' },
  { name: 'Ocean', hsl: '210 85% 45%' },
  { name: 'Rose', hsl: '340 80% 50%' },
  { name: 'Amber', hsl: '38 92% 50%' },
  { name: 'Slate', hsl: '222 47% 20%' },
  { name: 'Sand', hsl: '30 35% 35%' },
  { name: 'Cocoa', hsl: '20 35% 30%' },
  { name: 'Peach', hsl: '18 90% 60%' },
  { name: 'Forest', hsl: '140 35% 30%' },
  { name: 'Olive', hsl: '90 25% 32%' },
  { name: 'Teal', hsl: '180 35% 35%' },
  { name: 'Mauve', hsl: '280 25% 45%' },
];

const SPARK_BARS = [40, 65, 45, 80, 60, 90, 75];

/* ── Component ── */

export function Features() {
  const [hoveredTheme, setHoveredTheme] = useState<number | null>(null);
  const activeTheme = THEMES[hoveredTheme ?? 0];

  return (
    <section className="relative overflow-hidden bg-card pt-16 pb-24 sm:pt-20 sm:pb-32">
      {/* Subtle background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 55%, hsl(var(--primary) / 0.04), transparent)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <Reveal>
          <div className="mb-14 max-w-lg">
            <p className="mb-4 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              What&apos;s included
            </p>
            <h2 className="text-3xl font-serif tracking-[-0.01em] text-foreground sm:text-4xl">
              Everything you need,
              <br />
              nothing you don&apos;t.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              A focused editor, beautiful themes, and a link that works
              everywhere.
            </p>
          </div>
        </Reveal>

        {/* ── Bento Grid ── */}
        <div className="grid gap-4 lg:grid-cols-6">
          {/* ─ Card A: Guided Editor (hero card, spans 2 rows) ─ */}
          <Reveal delay={0.1} className="lg:col-span-3 lg:row-span-2">
            <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-background p-8 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
              {/* Hover gradient wash */}
              <div
                className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    'linear-gradient(180deg, hsl(var(--primary) / 0.04) 0%, transparent 50%)',
                }}
                aria-hidden="true"
              />

              <div className="relative z-10">
                <h3 className="text-lg font-medium text-foreground">
                  Guided Editor
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  Drag sections, edit inline, see every change live. Zero design
                  skills required.
                </p>
              </div>

              {/* Editor mockup */}
              <div className="relative z-10 mt-8 flex flex-1 flex-col gap-2.5">
                {/* Mini profile header */}
                <div className="mb-1 rounded-lg border bg-card/80 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/15" />
                    <div className="space-y-1.5">
                      <div className="h-2 w-20 rounded-full bg-foreground/20" />
                      <div className="h-1.5 w-28 rounded-full bg-muted" />
                    </div>
                  </div>
                </div>

                {SECTIONS.map((s) => (
                  <motion.div
                    key={s.label}
                    className={
                      'flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-200 ' +
                      (s.active
                        ? 'relative z-10 border-primary/15 bg-card shadow-md ring-1 ring-primary/20'
                        : 'bg-card/60 hover:bg-card/80')
                    }
                    whileHover={s.active ? { x: 6, scale: 1.02 } : { x: 3 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    {s.active && (
                      <div className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {s.label}
                    </span>
                    <div className="ml-auto flex flex-col gap-1">
                      <div
                        className={`h-1 rounded-full ${s.active ? 'w-14 bg-muted-foreground/20' : 'w-12 bg-muted'}`}
                      />
                      <div
                        className={`h-1 rounded-full ${s.active ? 'w-10 bg-muted-foreground/15' : 'w-8 bg-muted/60'}`}
                      />
                    </div>
                  </motion.div>
                ))}

                {/* Add section button */}
                <div className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 px-4 py-2.5 text-muted-foreground/50 transition-colors hover:border-primary/30 hover:text-muted-foreground">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Add section</span>
                </div>

                {/* Bottom fade */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
              </div>
            </div>
          </Reveal>

          {/* ─ Card B: 12 Color Themes ─ */}
          <Reveal delay={0.15} className="lg:col-span-3">
            <div className="group rounded-xl border bg-background p-8 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
              <h3 className="text-lg font-medium text-foreground">
                12 Color Themes
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Hand-picked palettes, each with light &amp; dark modes. Make it
                yours.
              </p>

              {/* Interactive mini preview */}
              <div
                className="mt-6 overflow-hidden rounded-lg border bg-card p-4 transition-all duration-500"
                style={{ borderColor: `hsl(${activeTheme.hsl} / 0.2)` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 shrink-0 rounded-full transition-colors duration-500"
                    style={{ backgroundColor: `hsl(${activeTheme.hsl})` }}
                  />
                  <div className="flex-1 space-y-1.5">
                    <div
                      className="h-2 w-20 rounded-full transition-colors duration-500"
                      style={{ backgroundColor: `hsl(${activeTheme.hsl})` }}
                    />
                    <div className="h-1.5 w-28 rounded-full bg-muted" />
                  </div>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {[0.12, 0.08, 0.05].map((opacity, i) => (
                    <div
                      key={i}
                      className="h-4 flex-1 rounded-md transition-colors duration-500"
                      style={{
                        backgroundColor: `hsl(${activeTheme.hsl} / ${opacity})`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Theme dot grid */}
              <div className="mt-4 grid grid-cols-6 gap-3">
                {THEMES.map((t, i) => (
                  <div key={t.name} className="flex justify-center">
                    <motion.button
                      type="button"
                      className="h-6 w-6 rounded-full ring-1 ring-border/50 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      style={{
                        backgroundColor: `hsl(${t.hsl})`,
                        boxShadow:
                          hoveredTheme === i
                            ? `0 0 12px hsl(${t.hsl} / 0.4)`
                            : 'none',
                      }}
                      whileHover={{ scale: 1.3 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 15,
                      }}
                      onHoverStart={() => setHoveredTheme(i)}
                      onHoverEnd={() => setHoveredTheme(null)}
                      onFocus={() => setHoveredTheme(i)}
                      onBlur={() => setHoveredTheme(null)}
                      aria-label={`Preview ${t.name} theme`}
                    />
                  </div>
                ))}
              </div>

              {/* Active theme label */}
              <p
                className="mt-3 text-center text-xs text-muted-foreground transition-opacity duration-300"
                style={{ opacity: hoveredTheme !== null ? 1 : 0 }}
                aria-live="polite"
              >
                {activeTheme.name}
              </p>
            </div>
          </Reveal>

          {/* ─ Card C: Shareable Link ─ */}
          <Reveal delay={0.2} className="lg:col-span-3">
            <div className="group rounded-xl border bg-background p-8 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
              <h3 className="text-lg font-medium text-foreground">
                Shareable Link
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                One clean link for LinkedIn, emails, your portfolio &mdash;
                everywhere that matters.
              </p>

              {/* Browser mockup */}
              <div className="mt-6 overflow-hidden rounded-lg border bg-card">
                <div className="flex items-center gap-2 border-b px-3 py-2">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-border" />
                    <div className="h-2 w-2 rounded-full bg-border" />
                    <div className="h-2 w-2 rounded-full bg-border" />
                  </div>
                  <div className="flex flex-1 items-center gap-2 rounded-md bg-muted/50 px-3 py-1">
                    <div className="flex-1 text-center">
                      <span className="font-mono text-xs text-muted-foreground">
                        opencv.app/
                      </span>
                      <span className="font-mono text-xs font-medium text-primary">
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
                    <Copy className="h-3 w-3 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
                  </div>
                </div>
                {/* Mini page preview */}
                <div className="space-y-2 p-4">
                  <div className="h-2 w-24 rounded bg-muted-foreground/15" />
                  <div className="h-2 w-36 rounded bg-muted" />
                  <div className="h-2 w-28 rounded bg-muted" />
                </div>
              </div>
            </div>
          </Reveal>

          {/* ─ Card D: Analytics ─ */}
          <Reveal delay={0.25} className="lg:col-span-2">
            <div className="group flex h-full flex-col rounded-xl border bg-background p-8 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-foreground">
                    Analytics
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    See who&apos;s viewing your profile and when. Know
                    what&apos;s working.
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
              </div>

              {/* Mini sparkline */}
              <div
                className="mt-6 flex h-12 items-end gap-1.5"
                aria-hidden="true"
              >
                {SPARK_BARS.map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 origin-bottom rounded-sm bg-primary/15 transition-colors group-hover:bg-primary/25"
                    style={{ height: `${h}%` }}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: 0.3 + i * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  This week
                </span>
                <span className="font-mono text-xs font-medium text-primary">
                  +24%
                </span>
              </div>
            </div>
          </Reveal>

          {/* ─ Card E: Templates ─ */}
          <Reveal delay={0.3} className="lg:col-span-2">
            <div className="group flex h-full flex-col rounded-xl border bg-background p-8 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-foreground">
                    Templates
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Start with a polished layout and make it your own. Hit the
                    ground running.
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
                  <Layout className="h-5 w-5 text-primary" />
                </div>
              </div>

              {/* Mini template grid */}
              <div
                className="mt-6 grid grid-cols-3 gap-2"
                aria-hidden="true"
              >
                {[
                  [100, 60, 40],
                  [50, 100, 50],
                  [70, 70, 70],
                ].map((rows, i) => (
                  <div
                    key={i}
                    className="rounded-md border bg-card p-2 transition-colors duration-300 group-hover:border-primary/15"
                  >
                    <div className="space-y-1">
                      {rows.map((w, j) => (
                        <div
                          key={j}
                          className="h-1 rounded-full bg-muted"
                          style={{ width: `${w}%` }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ─ Card F: Testimonials ─ */}
          <Reveal delay={0.35} className="lg:col-span-2">
            <div className="group flex h-full flex-col rounded-xl border bg-background p-8 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-foreground">
                    Testimonials
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Collect recommendations from colleagues. Let others vouch for
                    your work.
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
              </div>

              {/* Mini testimonial mockup */}
              <div className="mt-6 space-y-2" aria-hidden="true">
                <div className="rounded-lg border bg-card p-3 transition-colors duration-300 group-hover:border-primary/15">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/20" />
                    <div className="h-1.5 w-16 rounded-full bg-muted-foreground/20" />
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="h-1 w-full rounded-full bg-muted" />
                    <div className="h-1 w-3/4 rounded-full bg-muted" />
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-3 opacity-60">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-muted-foreground/10" />
                    <div className="h-1.5 w-12 rounded-full bg-muted" />
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="h-1 w-full rounded-full bg-muted/70" />
                    <div className="h-1 w-1/2 rounded-full bg-muted/70" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Decorative gradient divider */}
        <div className="mx-auto mt-16 h-px w-48 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </section>
  );
}
