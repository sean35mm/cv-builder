'use client';

import { useSortable } from '@dnd-kit/sortable';
import type { DraggableAttributes } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';

type RenderArgs = {
  attributes: DraggableAttributes;
  listeners: Record<string, unknown>;
  isDragging: boolean;
};

export function SortableItem({
  id,
  children,
}: {
  id: string;
  children: (args: RenderArgs) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="py-6 first:pt-0 last:pb-0">
      {children({ attributes, listeners, isDragging })}
    </div>
  );
}
