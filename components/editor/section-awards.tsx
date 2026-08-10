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
import { useWatch, type UseFormReturn } from 'react-hook-form';
import type { ProfileUpdateFormValues } from '@/lib/types';
import { ManagedMediaUploader } from '@/components/editor/managed-media-uploader';

export function SectionAwards({
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
  const awards = useWatch({ control: form.control, name: 'awards' });
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-foreground">Awards</h3>
        <Button type="button" onClick={onAdd}>
          Add Award
        </Button>
      </div>
      <div className="space-y-4">
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
                  <article className="space-y-5 rounded border border-border bg-card p-4 sm:p-5">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Reorder award ${index + 1}`}
                          className="flex min-h-11 min-w-11 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
                          {...attributes}
                          {...listeners}
                        >
                          <GripVertical className="w-4 h-4" />
                        </button>
                        Award
                      </h4>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`awards.${index}.title`}
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
                        name={`awards.${index}.year`}
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
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`awards.${index}.issuer`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Issuer</FormLabel>
                            <FormControl>
                              <Input {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`awards.${index}.link`}
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
                      name={`awards.${index}.description`}
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
                    <ManagedMediaUploader
                      images={awards[index]?.images ?? []}
                      label="Images (max 3)"
                      maxImages={3}
                      subject={`award ${index + 1}`}
                      onChange={(images) =>
                        form.setValue(`awards.${index}.images`, images, {
                          shouldDirty: true,
                        })
                      }
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive hover:text-destructive text-sm"
                        onClick={() => onRemove(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </article>
                )}
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
