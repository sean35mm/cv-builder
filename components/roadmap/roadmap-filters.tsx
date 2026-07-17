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
      className="flex flex-wrap border-y"
      role="tablist"
      aria-label="Filter by category"
    >
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.value;

        return (
          <button
            key={cat.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onCategoryChange(cat.value)}
            className={`relative min-h-11 border-r px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
