'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion';
import { RoadmapFilters } from '@/components/roadmap/roadmap-filters';
import { RoadmapItem } from '@/components/roadmap/roadmap-item';
import {
  ROADMAP_ITEMS,
  type RoadmapCategory,
} from '@/components/roadmap/roadmap-data';

const QUARTERS = ['Q4 2025', 'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];

export default function RoadmapPage() {
  const [activeCategory, setActiveCategory] = useState<
    RoadmapCategory | 'all'
  >('all');
  const reduce = useReducedMotion();

  const filteredItems = useMemo(
    () =>
      activeCategory === 'all'
        ? ROADMAP_ITEMS
        : ROADMAP_ITEMS.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  const counts = useMemo(() => {
    const done = filteredItems.filter((i) => i.status === 'done').length;
    const inProgress = filteredItems.filter(
      (i) => i.status === 'in-progress'
    ).length;
    const planned = filteredItems.filter((i) => i.status === 'planned').length;
    const total = filteredItems.length;
    return { done, inProgress, planned, total };
  }, [filteredItems]);

  const groupedByQuarter = useMemo(() => {
    const groups: Record<string, typeof filteredItems> = {};
    for (const q of QUARTERS) {
      const items = filteredItems.filter((i) => i.quarter === q);
      if (items.length > 0) groups[q] = items;
    }
    return groups;
  }, [filteredItems]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-16">
        {/* Back button */}
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            &larr; Back to Home
          </Button>
        </Link>

        {/* Header */}
        <Reveal>
          <div className="mb-4">
            <p className="mb-4 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              What&apos;s next
            </p>
            <h1 className="text-4xl font-bold font-serif text-foreground">
              Roadmap
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Follow along as we build OpenCV in public. Here&apos;s what
              we&apos;ve shipped, what we&apos;re working on, and what&apos;s
              coming next.
            </p>
          </div>
        </Reveal>

        {/* Progress summary */}
        <Reveal delay={0.1}>
          <div className="mb-8 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="font-medium text-primary">
                  {counts.done}
                </span>
                <span className="text-muted-foreground">shipped</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="font-medium text-amber-500">
                  {counts.inProgress}
                </span>
                <span className="text-muted-foreground">in progress</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                <span className="font-medium text-muted-foreground">
                  {counts.planned}
                </span>
                <span className="text-muted-foreground">planned</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="flex h-2 flex-1 min-w-[120px] overflow-hidden rounded-full bg-muted">
              {reduce ? (
                <>
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${(counts.done / counts.total) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-amber-500"
                    style={{
                      width: `${(counts.inProgress / counts.total) * 100}%`,
                    }}
                  />
                </>
              ) : (
                <>
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    whileInView={{
                      width: `${(counts.done / counts.total) * 100}%`,
                    }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.6,
                      delay: 0.2,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                  <motion.div
                    className="h-full bg-amber-500"
                    initial={{ width: 0 }}
                    whileInView={{
                      width: `${(counts.inProgress / counts.total) * 100}%`,
                    }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.6,
                      delay: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </Reveal>

        {/* Filters + Timeline */}
        <LayoutGroup>
          <Reveal delay={0.15}>
            <RoadmapFilters
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </Reveal>

          {/* Timeline */}
          <div className="mt-12 space-y-12">
            <AnimatePresence mode="popLayout">
              {QUARTERS.map((quarter) => {
                const items = groupedByQuarter[quarter];
                if (!items) return null;

                return (
                  <motion.section
                    key={quarter}
                    layout={!reduce}
                    initial={reduce ? undefined : { opacity: 0, y: 12 }}
                    animate={reduce ? undefined : { opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: -12 }}
                    transition={{
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {/* Quarter label */}
                    <div className="mb-6 flex items-center gap-3">
                      <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        {quarter}
                      </h2>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    {/* Timeline line + items */}
                    <div className="relative space-y-4">
                      {/* Connecting vertical line */}
                      {reduce ? (
                        <div
                          className="absolute left-[5px] top-0 bottom-0 w-px bg-border"
                          aria-hidden="true"
                        />
                      ) : (
                        <motion.div
                          className="absolute left-[5px] top-0 bottom-0 w-px origin-top bg-border"
                          initial={{ scaleY: 0 }}
                          whileInView={{ scaleY: 1 }}
                          viewport={{ once: true, amount: 0.1 }}
                          transition={{
                            duration: 0.6,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          aria-hidden="true"
                        />
                      )}

                      {/* Items */}
                      {items.map((item, i) => (
                        <Reveal key={item.id} delay={0.08 * i}>
                          <RoadmapItem item={item} />
                        </Reveal>
                      ))}
                    </div>
                  </motion.section>
                );
              })}
            </AnimatePresence>

            {/* Empty state */}
            {Object.keys(groupedByQuarter).length === 0 && (
              <div className="rounded-xl border bg-card p-12 text-center">
                <p className="text-muted-foreground">
                  No items match this filter. Try a different category.
                </p>
              </div>
            )}
          </div>
        </LayoutGroup>

        {/* Footer note */}
        <Reveal delay={0.1}>
          <div className="mt-16 rounded-xl border bg-card/50 p-6">
            <p className="text-sm text-muted-foreground">
              This roadmap is a living document and priorities may shift. Follow
              our development on{' '}
              <a
                href="https://github.com/sean35mm/cv-builder"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline-offset-2 hover:underline"
              >
                GitHub
              </a>{' '}
              and join the conversation on{' '}
              <a
                href="https://x.com/doughydev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline-offset-2 hover:underline"
              >
                X (Twitter)
              </a>
              .
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
