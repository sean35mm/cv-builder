'use client';

import { GripVertical, Star, X } from 'lucide-react';
import { useWatch, type UseFormReturn } from 'react-hook-form';

import { ManagedMediaUploader } from '@/components/editor/managed-media-uploader';
import { SortableItem } from '@/components/editor/sortable-item';
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

const MAX_PROJECT_IMAGES = 3;

const PROJECT_CATEGORIES = [
  'Web Application',
  'Mobile App',
  'Desktop App',
  'API/Backend',
  'Open Source',
  'Design',
  'Data/ML',
  'Other',
] as const;

function useProjectEntryCommands(
  form: UseFormReturn<ProfileUpdateFormValues>,
  index: number
) {
  const addTechnology = (tag: string) => {
    const current = form.getValues(`projects.${index}.technologies`) || [];
    const nextTag = tag.trim();
    if (nextTag && !current.includes(nextTag)) {
      form.setValue(`projects.${index}.technologies`, [...current, nextTag], {
        shouldDirty: true,
      });
    }
  };

  const removeTechnology = (tagIndex: number) => {
    const current = form.getValues(`projects.${index}.technologies`) || [];
    form.setValue(
      `projects.${index}.technologies`,
      current.filter((_, currentIndex) => currentIndex !== tagIndex),
      { shouldDirty: true }
    );
  };

  return {
    addTechnology,
    removeTechnology,
  };
}

export function ProjectEntryRow({
  form,
  fieldKey,
  index,
  onRemove,
}: {
  form: UseFormReturn<ProfileUpdateFormValues>;
  fieldKey: string;
  index: number;
  onRemove: (index: number) => void;
}) {
  const [images = [], technologies = [], isFeatured] = useWatch({
    control: form.control,
    name: [
      `projects.${index}.images`,
      `projects.${index}.technologies`,
      `projects.${index}.isFeatured`,
    ],
  });
  const { addTechnology, removeTechnology } = useProjectEntryCommands(
    form,
    index
  );
  return (
    <SortableItem id={fieldKey}>
      {({ attributes, listeners }) => (
        <article className="space-y-5 rounded border border-border bg-card p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <button
                type="button"
                aria-label={`Reorder project ${index + 1}`}
                className="flex min-h-11 min-w-11 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="w-4 h-4" />
              </button>
              <span>Project details</span>
              {isFeatured && (
                <Star className="w-4 h-4 text-primary fill-primary" />
              )}
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name={`projects.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`projects.${index}.year`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="YYYY" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name={`projects.${index}.company`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company or Client</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`projects.${index}.link`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link</FormLabel>
                  <FormControl>
                    <Input type="url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name={`projects.${index}.category`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm"
                      value={field.value || ''}
                      onChange={field.onChange}
                    >
                      <option value="">Select category</option>
                      {PROJECT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`projects.${index}.isFeatured`}
              render={({ field }) => (
                <FormItem className="flex items-end gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value || false}
                      onChange={(event) => field.onChange(event.target.checked)}
                      className="h-5 w-5 rounded-md border-input"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">
                    Featured project
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>

          <ManagedMediaUploader
            images={images}
            label="Images (max 3)"
            maxImages={MAX_PROJECT_IMAGES}
            subject={`project ${index + 1}`}
            onChange={(nextImages) =>
              form.setValue(`projects.${index}.images`, nextImages, {
                shouldDirty: true,
              })
            }
          />

          <div className="space-y-2">
            <FormLabel>Technologies</FormLabel>
            <div className="flex gap-1.5 flex-wrap">
              {technologies.map((technology, technologyIndex) => (
                <span
                  key={technologyIndex}
                  className="inline-flex min-h-9 items-center gap-1 rounded border border-border bg-background px-2.5 text-xs"
                >
                  {technology}
                  <button
                    type="button"
                    aria-label={`Remove ${technology} technology`}
                    onClick={() => removeTechnology(technologyIndex)}
                    className="flex min-h-8 min-w-8 items-center justify-center hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tech..."
                className="min-h-11 w-32 rounded-xl border bg-background px-3 text-xs"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    const input = event.currentTarget;
                    const value = input.value.trim();
                    if (value) {
                      addTechnology(value);
                      input.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name={`projects.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
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
  );
}
