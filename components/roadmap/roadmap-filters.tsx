'use client';

import { useEffect, useRef, type KeyboardEvent } from 'react';
import { ChevronRight } from 'lucide-react';

import { CATEGORIES, type RoadmapCategory } from './roadmap-data';

type RoadmapFiltersProps = {
  activeCategory: RoadmapCategory | 'all';
  onCategoryChange: (category: RoadmapCategory | 'all') => void;
};

export function RoadmapFilters({
  activeCategory,
  onCategoryChange,
}: RoadmapFiltersProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = CATEGORIES.findIndex(
      (category) => category.value === activeCategory
    );
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    tabRefs.current[activeIndex]?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [activeCategory]);

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    let nextIndex: number | undefined;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % CATEGORIES.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + CATEGORIES.length) % CATEGORIES.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = CATEGORIES.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextCategory = CATEGORIES[nextIndex];
    tabRefs.current[nextIndex]?.focus();
    onCategoryChange(nextCategory.value);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] sm:block">
      <div
        className="scrollbar-hide overflow-x-auto border-y border-border py-2"
        role="tablist"
        aria-label="Filter by category"
      >
        <div className="flex min-w-max gap-1">
          {CATEGORIES.map((cat, index) => {
            const isActive = activeCategory === cat.value;

            return (
              <button
                key={cat.value}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                aria-controls="roadmap-items"
                onClick={() => onCategoryChange(cat.value)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={`relative min-h-11 rounded px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? 'border border-foreground bg-foreground text-background'
                    : 'border border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
      <div
        className="flex w-7 items-center justify-center border-y border-l border-border text-muted-foreground sm:hidden"
        aria-hidden="true"
      >
        <ChevronRight className="size-4" />
      </div>
    </div>
  );
}
