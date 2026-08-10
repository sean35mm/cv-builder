'use client';

import { CATEGORIES, type RoadmapCategory } from './roadmap-data';

type RoadmapFiltersProps = {
  activeCategory: RoadmapCategory | 'all';
  onCategoryChange: (category: RoadmapCategory | 'all') => void;
};

export function RoadmapFilters({
  activeCategory,
  onCategoryChange,
}: RoadmapFiltersProps) {
  return (
    <div
      className="overflow-x-auto border-y border-border py-2"
      role="tablist"
      aria-label="Filter by category"
    >
      <div className="flex min-w-max gap-1">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value;

          return (
            <button
              key={cat.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="roadmap-items"
              onClick={() => onCategoryChange(cat.value)}
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
  );
}
