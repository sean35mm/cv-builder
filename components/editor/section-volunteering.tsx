'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MonthInput } from '@/components/editor/month-input';
import { Separator } from '@/components/ui/separator';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '@/components/editor/sortable-item';
import { GripVertical } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { Fragment } from 'react';
import type { ProfileUpdateFormValues } from '@/lib/types';

export function SectionVolunteering({
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
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-foreground">Volunteering</h3>
        <Button type="button" onClick={onAdd}>
          Add Volunteering
        </Button>
      </div>
      <div className="divide-y divide-border">
        <DndContext
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
            {fields.map((field, index) => {
              const current = form.watch(`volunteering.${index}.current`);
              return (
                <SortableItem key={field.fieldKey} id={field.fieldKey}>
                  {({ attributes, listeners }) => (
                    <div className="rounded-xl p-5 bg-card border border-white/10 space-y-4">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          <button
                            type="button"
                            className="text-muted-foreground cursor-grab active:cursor-grabbing"
                            {...attributes}
                            {...listeners}
                          >
                            <GripVertical className="w-4 h-4" />
                          </button>
                          Volunteering
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`volunteering.${index}.role`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormControl>
                                <Input {...f} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`volunteering.${index}.organization`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Organization</FormLabel>
                              <FormControl>
                                <Input {...f} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`volunteering.${index}.startDate`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <MonthInput
                                  value={f.value}
                                  onChange={f.onChange}
                                  disabled={f.disabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`volunteering.${index}.endDate`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <MonthInput
                                  value={f.value}
                                  onChange={f.onChange}
                                  disabled={current}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`volunteering.${index}.current`}
                        render={({ field: f }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={f.value}
                                onCheckedChange={(checked) =>
                                  f.onChange(Boolean(checked))
                                }
                              />
                            </FormControl>
                            <FormLabel className="text-sm text-muted-foreground font-normal">
                              Current
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`volunteering.${index}.description`}
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
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
