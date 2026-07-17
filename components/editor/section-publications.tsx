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
import { Textarea } from '@/components/ui/textarea';
import type { ProfileUpdateFormValues } from '@/lib/profile/editor';

export function SectionPublications({
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
    <section className="space-y-6" aria-labelledby="publications-heading">
      <div className="flex items-center justify-between">
        <h3 id="publications-heading" className="text-lg font-medium">
          Publications
        </h3>
        <Button type="button" onClick={onAdd}>
          Add Publication
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
                  <article className="space-y-4 py-6">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        aria-label={`Reorder publication ${index + 1}`}
                        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground"
                        {...attributes}
                        {...listeners}
                      >
                        <GripVertical className="h-4 w-4" />
                        <span className="font-mono text-xs">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        Publication
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onRemove(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`publications.${index}.title`}
                        render={({ field: input }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...input} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`publications.${index}.publisher`}
                        render={({ field: input }) => (
                          <FormItem>
                            <FormLabel>Publisher</FormLabel>
                            <FormControl>
                              <Input {...input} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`publications.${index}.date`}
                        render={({ field: input }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input
                                {...input}
                                placeholder="YYYY or Month YYYY"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`publications.${index}.url`}
                        render={({ field: input }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input {...input} type="url" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`publications.${index}.authors`}
                      render={({ field: input }) => (
                        <FormItem>
                          <FormLabel>Authors</FormLabel>
                          <FormControl>
                            <Input
                              value={(input.value ?? []).join(', ')}
                              onBlur={input.onBlur}
                              name={input.name}
                              ref={input.ref}
                              onChange={(event) =>
                                input.onChange(
                                  event.target.value
                                    .split(',')
                                    .map((author) => author.trim())
                                    .filter(Boolean)
                                )
                              }
                              placeholder="Separate names with commas"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`publications.${index}.description`}
                      render={({ field: input }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...input} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
