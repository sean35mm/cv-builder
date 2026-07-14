'use client';

import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { UseFormReturn } from 'react-hook-form';

import { ProjectEntryRow } from '@/components/editor/project-entry-row';
import { useSortableSensors } from '@/components/editor/sortable-item';
import { Button } from '@/components/ui/button';
import type { ProfileUpdateFormValues } from '@/lib/profile/editor';

export function SectionProjects({
  form,
  fields,
  onAdd,
  onRemove,
  onMove,
}: {
  form: UseFormReturn<ProfileUpdateFormValues>;
  fields: Array<{ fieldKey: string }>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (oldIndex: number, newIndex: number) => void;
}) {
  const sensors = useSortableSensors();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-foreground">Projects</h3>
        <Button type="button" onClick={onAdd}>
          Add Project
        </Button>
      </div>
      <div className="divide-y divide-border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (!over) return;
            const oldIndex = fields.findIndex(
              (field) => field.fieldKey === String(active.id)
            );
            const newIndex = fields.findIndex(
              (field) => field.fieldKey === String(over.id)
            );
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              onMove(oldIndex, newIndex);
            }
          }}
        >
          <SortableContext
            items={fields.map((field) => field.fieldKey)}
            strategy={verticalListSortingStrategy}
          >
            {fields.map((field, index) => (
              <ProjectEntryRow
                key={field.fieldKey}
                form={form}
                fieldKey={field.fieldKey}
                index={index}
                onRemove={onRemove}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
