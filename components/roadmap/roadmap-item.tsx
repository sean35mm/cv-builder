'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIG, type RoadmapItem as RoadmapItemType } from './roadmap-data';

type RoadmapItemProps = {
  item: RoadmapItemType;
};

export function RoadmapItem({ item }: RoadmapItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const reduce = useReducedMotion();
  const config = STATUS_CONFIG[item.status];

  return (
    <div className="relative flex gap-4 pl-8">
      {/* Timeline dot */}
      {item.status === 'in-progress' && !reduce ? (
        <motion.div
          className={`absolute left-0 top-6 z-10 flex h-3 w-3 items-center justify-center rounded-full ${config.dotClass}`}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: 'easeInOut',
          }}
        />
      ) : (
        <div
          className={`absolute left-0 top-6 z-10 flex h-3 w-3 items-center justify-center rounded-full ${config.dotClass}`}
        >
          {item.status === 'done' && (
            <Check className="h-2 w-2 text-primary-foreground" strokeWidth={3} />
          )}
        </div>
      )}

      {/* Card */}
      <motion.div
        className="group flex-1 cursor-default rounded-xl border bg-background p-6 transition-colors duration-300 hover:border-primary/20 hover:shadow-lg"
        layout={!reduce}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        tabIndex={0}
        role="article"
        aria-label={`${item.title} — ${config.label}`}
      >
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={config.badgeClass}>{config.label}</Badge>
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60">
            {item.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-base font-medium text-foreground">
          {item.title}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>

        {/* Hover expansion — detail */}
        <AnimatePresence initial={false}>
          {isHovered && (
            <motion.div
              initial={reduce ? undefined : { opacity: 0, height: 0 }}
              animate={reduce ? undefined : { opacity: 1, height: 'auto' }}
              exit={reduce ? undefined : { opacity: 0, height: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
              className="overflow-hidden"
            >
              <p className="mt-3 border-t border-border/50 pt-3 text-sm leading-relaxed text-muted-foreground/80">
                {item.detail}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand hint */}
        <div className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground/40 transition-colors group-hover:text-muted-foreground/60">
          <ChevronRight
            className={`h-3 w-3 transition-transform duration-200 ${isHovered ? 'rotate-90' : ''}`}
          />
          <span>{isHovered ? 'Details' : 'Hover for details'}</span>
        </div>
      </motion.div>
    </div>
  );
}
