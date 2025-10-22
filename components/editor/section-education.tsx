'use client';

import { MonthInput } from '@/components/editor/month-input';
import { SortableItem } from '@/components/editor/sortable-item';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ProfileUpdateFormValues } from '@/lib/types';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

export function SectionEducation({
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
        <h3 className="text-lg font-medium text-foreground">Education</h3>
        <Button type="button" onClick={onAdd}>
          Add Education
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
              const current = form.watch(`education.${index}.current`);
              return (
                <SortableItem key={field.fieldKey} id={field.fieldKey}>
                  {({ attributes, listeners }) => (
                    <div className="rounded-xl p-5 bg-card border border-white/10 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          <button
                            type="button"
                            className="text-muted-foreground cursor-grab active:cursor-grabbing"
                            {...attributes}
                            {...listeners}
                          >
                            <GripVertical className="w-4 h-4" />
                          </button>
                          Education Entry
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 text-sm"
                          onClick={() => onRemove(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`education.${index}.degree`}
                          render={({ field: degreeField }) => (
                            <FormItem>
                              <FormLabel>Degree</FormLabel>
                              <FormControl>
                                <Input {...degreeField} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`education.${index}.school`}
                          render={({ field: schoolField }) => (
                            <FormItem>
                              <FormLabel>School</FormLabel>
                              <FormControl>
                                <Input {...schoolField} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`education.${index}.startDate`}
                          render={({ field: startField }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <MonthInput
                                  value={startField.value}
                                  onChange={startField.onChange}
                                  disabled={startField.disabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`education.${index}.endDate`}
                          render={({ field: endField }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <MonthInput
                                  value={endField.value}
                                  onChange={endField.onChange}
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
                        name={`education.${index}.current`}
                        render={({ field: currentField }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={currentField.value}
                                onCheckedChange={(checked) =>
                                  currentField.onChange(Boolean(checked))
                                }
                              />
                            </FormControl>
                            <FormLabel className="text-sm text-muted-foreground font-normal">
                              Currently studying
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`education.${index}.description`}
                        render={({ field: descriptionField }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea rows={3} {...descriptionField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
