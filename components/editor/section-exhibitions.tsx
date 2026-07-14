'use client';

import { Button } from '@/components/ui/button';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  SortableItem,
  useSortableSensors,
} from '@/components/editor/sortable-item';
import { GripVertical } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { ProfileUpdateFormValues } from '@/lib/types';

export function SectionExhibitions({
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
        <h3 className="text-lg font-medium text-foreground">Exhibitions</h3>
        <Button type="button" onClick={onAdd}>
          Add Exhibition
        </Button>
      </div>
      <div className="divide-y divide-border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (!over) return;
            const oldIndex = fields.findIndex(
              (f) => f.fieldKey === String(active.id)
            );
            const newIndex = fields.findIndex(
              (f) => f.fieldKey === String(over.id)
            );
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              onMove(oldIndex, newIndex);
            }
          }}
        >
          <SortableContext
            items={fields.map((f) => f.fieldKey)}
            strategy={verticalListSortingStrategy}
          >
            {fields.map((field, index) => (
              <SortableItem key={field.fieldKey} id={field.fieldKey}>
                {({ attributes, listeners }) => (
                  <div className="rounded-xl p-5 bg-card border border-white/10 space-y-4">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Reorder exhibition ${index + 1}`}
                          className="text-muted-foreground cursor-grab active:cursor-grabbing"
                          {...attributes}
                          {...listeners}
                        >
                          <GripVertical className="w-4 h-4" />
                        </button>
                        Exhibition
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`exhibitions.${index}.title`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`exhibitions.${index}.year`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                              <Input {...f} placeholder="YYYY" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`exhibitions.${index}.venue`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Venue</FormLabel>
                            <FormControl>
                              <Input {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`exhibitions.${index}.location`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`exhibitions.${index}.link`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Link</FormLabel>
                            <FormControl>
                              <Input type="url" {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`exhibitions.${index}.description`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea rows={3} {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 text-sm"
                        onClick={() => onRemove(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
