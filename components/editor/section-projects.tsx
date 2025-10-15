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
import { Separator } from '@/components/ui/separator';
import type { UseFormReturn } from 'react-hook-form';
import { Fragment } from 'react';
import type { ProfileUpdateFormValues } from '@/lib/types';

export function SectionProjects({
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
        <h3 className="text-lg font-medium text-foreground">Projects</h3>
        <Button type="button" onClick={onAdd}>
          Add Project
        </Button>
      </div>
      {fields.map((field, index) => (
        <Fragment key={field.fieldKey}>
          <div className="rounded-xl p-5 bg-card space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`projects.${index}.title`}
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
                name={`projects.${index}.year`}
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`projects.${index}.company`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>Company or Client</FormLabel>
                    <FormControl>
                      <Input {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`projects.${index}.link`}
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
              name={`projects.${index}.description`}
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
      ))}
    </div>
  );
}
