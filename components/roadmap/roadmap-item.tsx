'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  STATUS_CONFIG,
  type RoadmapItem as RoadmapItemType,
} from './roadmap-data';

type RoadmapItemProps = {
  item: RoadmapItemType;
};

export function RoadmapItem({ item }: RoadmapItemProps) {
  const reduce = useReducedMotion();
  const config = STATUS_CONFIG[item.status];

  return (
    <motion.article
      className="group h-full border-t border-border py-6 sm:py-8"
      layout={!reduce}
      aria-label={`${item.title} — ${config.label}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={config.badgeClass}>{config.label}</Badge>
          <span className="rounded border border-border px-3 py-1 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {item.category}
          </span>
        </div>

        <h3 className="mt-4 font-display text-xl font-semibold tracking-[-0.02em] text-foreground">
          {item.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {item.description}
        </p>

        <details className="group/details mt-auto pt-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <ChevronRight className="h-4 w-4 transition-transform duration-150 group-open/details:rotate-90" />
            <span>View details</span>
          </summary>
          <p className="border border-border bg-secondary/40 p-4 text-sm leading-6 text-muted-foreground">
            {item.detail}
          </p>
        </details>
      </div>
    </motion.article>
  );
}
