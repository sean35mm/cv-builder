'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
} from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Reveal } from '@/components/motion';
import { BrandLockup } from '@/components/platform/brand-lockup';
import { RoadmapFilters } from '@/components/roadmap/roadmap-filters';
import { RoadmapItem } from '@/components/roadmap/roadmap-item';
import {
  ROADMAP_ITEMS,
  type RoadmapCategory,
} from '@/components/roadmap/roadmap-data';

const QUARTERS = ['Q4 2025', 'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function RoadmapPage() {
  const [activeCategory, setActiveCategory] = useState<RoadmapCategory | 'all'>(
    'all'
  );
  const reduce = useReducedMotion();
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const shouldReduce = mounted && reduce;

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
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BrandLockup />
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>

        <header className="border-b border-border pb-10 pt-16 sm:pb-14 sm:pt-24">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            What&apos;s next
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-semibold tracking-[-0.02em] text-foreground sm:text-6xl">
            Roadmap
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Follow along as we build OpenCV in public. Here&apos;s what
            we&apos;ve shipped, what we&apos;re working on, and what&apos;s
            coming next.
          </p>
        </header>

        <Reveal delay={0.1}>
          <div className="mb-6 border-b border-border py-5 sm:flex sm:items-center sm:gap-8 sm:py-6">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-foreground" />
                <span className="font-medium text-foreground">
                  {counts.done}
                </span>
                <span className="text-muted-foreground">shipped</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 bg-accent" />
                <span className="font-medium text-accent">
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

            <div
              className="mt-5 flex h-1 min-w-[120px] flex-1 overflow-hidden bg-secondary sm:mt-0"
              role="progressbar"
              aria-label="Roadmap progress"
              aria-valuemin={0}
              aria-valuemax={counts.total}
              aria-valuenow={counts.done + counts.inProgress}
            >
              <motion.div
                className="h-full bg-foreground"
                initial={{ width: 0 }}
                animate={
                  shouldReduce
                    ? { width: `${(counts.done / counts.total) * 100}%` }
                    : undefined
                }
                whileInView={
                  shouldReduce
                    ? undefined
                    : { width: `${(counts.done / counts.total) * 100}%` }
                }
                viewport={{ once: true }}
                transition={
                  shouldReduce
                    ? { duration: 0 }
                    : {
                        duration: 0.6,
                        delay: 0.2,
                        ease: [0.16, 1, 0.3, 1],
                      }
                }
              />
              <motion.div
                className="h-full bg-accent"
                initial={{ width: 0 }}
                animate={
                  shouldReduce
                    ? {
                        width: `${(counts.inProgress / counts.total) * 100}%`,
                      }
                    : undefined
                }
                whileInView={
                  shouldReduce
                    ? undefined
                    : {
                        width: `${(counts.inProgress / counts.total) * 100}%`,
                      }
                }
                viewport={{ once: true }}
                transition={
                  shouldReduce
                    ? { duration: 0 }
                    : {
                        duration: 0.6,
                        delay: 0.4,
                        ease: [0.16, 1, 0.3, 1],
                      }
                }
              />
            </div>
          </div>
        </Reveal>

        <LayoutGroup>
          <Reveal delay={0.15}>
            <RoadmapFilters
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </Reveal>

          <div id="roadmap-items" className="mt-10 space-y-12">
            <AnimatePresence mode="popLayout">
              {QUARTERS.map((quarter) => {
                const items = groupedByQuarter[quarter];
                if (!items) return null;

                return (
                  <motion.section
                    key={quarter}
                    layout={!shouldReduce}
                    initial={{ opacity: 0, y: 12 }}
                    animate={
                      shouldReduce
                        ? { opacity: 1, x: 0, y: 0 }
                        : { opacity: 1, y: 0 }
                    }
                    exit={shouldReduce ? undefined : { opacity: 0, y: -12 }}
                    transition={
                      shouldReduce
                        ? { duration: 0 }
                        : {
                            duration: 0.35,
                            ease: [0.16, 1, 0.3, 1],
                          }
                    }
                  >
                    <div className="mb-5 border-b border-border pb-3">
                      <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {quarter}
                      </h2>
                    </div>

                    <div>
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

            {Object.keys(groupedByQuarter).length === 0 && (
              <div className="border-y border-border py-12 text-center">
                <p className="text-muted-foreground">
                  No items match this filter. Try a different category.
                </p>
              </div>
            )}
          </div>
        </LayoutGroup>

        <Reveal delay={0.1}>
          <div className="mb-8 mt-16 border-t border-border pt-6">
            <p className="text-sm leading-6 text-muted-foreground">
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
      </main>
    </div>
  );
}
