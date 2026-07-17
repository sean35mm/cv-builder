'use client';

import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import {
  SortableItem,
  useSortableSensors,
} from '@/components/editor/sortable-item';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  LANGUAGE_PROFICIENCIES,
  LANGUAGE_PROFICIENCY_LABELS,
} from '@/lib/profile/domain';
import type { ProfileUpdateFormValues } from '@/lib/profile/editor';

export function SectionLanguages({
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
    <section className="space-y-6" aria-labelledby="languages-heading">
      <div className="flex items-center justify-between">
        <h3 id="languages-heading" className="text-lg font-medium">
          Languages
        </h3>
        <Button type="button" onClick={onAdd}>
          Add Language
        </Button>
      </div>
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
          if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
            onMove(oldIndex, newIndex);
          }
        }}
      >
        <SortableContext
          items={fields.map((field) => field.fieldKey)}
          strategy={verticalListSortingStrategy}
        >
          <div className="divide-y divide-border">
            {fields.map((field, index) => (
              <SortableItem key={field.fieldKey} id={field.fieldKey}>
                {({ attributes, listeners }) => (
                  <article className="grid gap-4 py-5 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                    <button
                      type="button"
                      aria-label={`Reorder language ${index + 1}`}
                      className="flex min-h-11 min-w-11 items-center justify-center self-center text-muted-foreground"
                      {...attributes}
                      {...listeners}
                    >
                      <GripVertical className="h-4 w-4" />
                      <span className="sr-only">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </button>
                    <FormField
                      control={form.control}
                      name={`languages.${index}.name`}
                      render={({ field: input }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
                          <FormControl>
                            <Input {...input} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`languages.${index}.proficiency`}
                      render={({ field: input }) => (
                        <FormItem>
                          <FormLabel>Proficiency</FormLabel>
                          <FormControl>
                            <select
                              {...input}
                              value={input.value ?? ''}
                              className="flex h-11 w-full rounded-[2px] border border-input bg-background px-3 text-sm"
                            >
                              <option value="">Not specified</option>
                              {LANGUAGE_PROFICIENCIES.map((proficiency) => (
                                <option key={proficiency} value={proficiency}>
                                  {LANGUAGE_PROFICIENCY_LABELS[proficiency]}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onRemove(index)}
                    >
                      Remove
                    </Button>
                  </article>
                )}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
