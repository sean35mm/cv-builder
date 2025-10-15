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
import type { UseFormReturn } from 'react-hook-form';
import { Fragment } from 'react';
import type { ProfileUpdateFormValues } from '@/lib/types';

export function SectionVolunteering({
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
        <h3 className="text-lg font-medium text-foreground">Volunteering</h3>
        <Button type="button" onClick={onAdd}>
          Add Volunteering
        </Button>
      </div>
      {fields.map((field, index) => {
        const current = form.watch(`volunteering.${index}.current`);
        return (
          <Fragment key={field.fieldKey}>
            <div className="rounded-xl p-5 bg-card space-y-4">
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
            {index < fields.length - 1 && (
              <Separator className="my-4 opacity-40" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
