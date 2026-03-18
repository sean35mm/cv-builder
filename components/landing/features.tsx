'use client';

import { Reveal } from '@/components/motion';
import { Edit, Palette, Share2 } from 'lucide-react';

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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 - spans 2 rows on large screens */}
          <Reveal
            delay={0.1}
            className="sm:col-span-2 lg:col-span-1 lg:row-span-2"
          >
            <div className="group h-full rounded-lg border bg-background p-8 transition-colors hover:border-primary/30">
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Edit className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                Guided Editor
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                A focused, step-by-step editor that walks you through each
                section of your CV. Drag to reorder, edit inline, see changes
                live. No design experience needed.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Drag &amp; Drop
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>
          </Reveal>

          {/* Feature 2 */}
          <Reveal delay={0.15}>
            <div className="group rounded-lg border bg-background p-8 transition-colors hover:border-primary/30">
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                12 Color Themes
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Pick from 12 curated palettes with light and dark modes. Every
                profile feels personal, not templated.
              </p>
            </div>
          </Reveal>

          {/* Feature 3 */}
          <Reveal delay={0.2}>
            <div className="group rounded-lg border bg-background p-8 transition-colors hover:border-primary/30">
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                Shareable Link
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Get a clean URL like opencv.app/@you. Share it anywhere &mdash;
                LinkedIn, emails, or your portfolio.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
