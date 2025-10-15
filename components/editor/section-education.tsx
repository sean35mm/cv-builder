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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { MonthInput } from '@/components/editor/month-input';
import type { UseFormReturn } from 'react-hook-form';
import { Fragment } from 'react';
import type { ProfileUpdateFormValues } from '@/lib/types';

export function SectionEducation({
  form,
  fields,
  onAdd,
  onRemove,
}: {
  form: UseFormReturn<ProfileUpdateFormValues>;
  fields: Array<{ fieldKey: string }>;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-foreground">Education</h3>
        <Button type="button" onClick={onAdd}>
          Add Education
        </Button>
      </div>
      {fields.map((field, index) => {
        const current = form.watch(`education.${index}.current`);
        return (
          <Fragment key={field.fieldKey}>
            <div className="rounded-xl p-5 bg-card space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-foreground">Education Entry</h4>
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
            {index < fields.length - 1 && (
              <Separator className="my-4 opacity-40" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
