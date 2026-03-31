'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CATEGORIES, type RoadmapCategory } from './roadmap-data';

type RoadmapFiltersProps = {
  activeCategory: RoadmapCategory | 'all';
  onCategoryChange: (category: RoadmapCategory | 'all') => void;
};

export function RoadmapFilters({
  activeCategory,
  onCategoryChange,
}: RoadmapFiltersProps) {
  const reduce = useReducedMotion();

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.value;

        return (
          <button
            key={cat.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onCategoryChange(cat.value)}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {/* Sliding background indicator */}
            {isActive &&
              (reduce ? (
                <span className="absolute inset-0 rounded-full bg-primary" />
              ) : (
                <motion.span
                  layoutId="active-filter"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 28,
                  }}
                />
              ))}

            {/* Inactive background */}
            {!isActive && (
              <span className="absolute inset-0 rounded-full border bg-card" />
            )}

            <span className="relative z-10">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
