'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { GripVertical, Plus, Star, X } from 'lucide-react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

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
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { ProfileUpdateFormValues } from '@/lib/profile/editor';
import { cn } from '@/lib/utils';

const MAX_PROJECT_IMAGES = 3;
const MAX_PROJECT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

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
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const finalizeImageUpload = useMutation(api.storage.finalizeImageUpload);
  const deleteImage = useMutation(api.storage.deleteImage);
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File) => {
    const currentImages = form.getValues(`projects.${index}.images`) || [];
    if (currentImages.length >= MAX_PROJECT_IMAGES) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }

    if (file.size > MAX_PROJECT_IMAGE_SIZE_BYTES) {
      toast.error('Project images must be 5MB or smaller.');
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl, uploadToken } = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!result.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult: unknown = await result.json();
      if (
        typeof uploadResult !== 'object' ||
        uploadResult === null ||
        !('storageId' in uploadResult) ||
        typeof uploadResult.storageId !== 'string'
      ) {
        throw new Error('Upload failed');
      }
      const storageId = uploadResult.storageId as Id<'_storage'>;
      const finalization = await finalizeImageUpload({
        storageId,
        uploadToken,
      });
      if (finalization.status === 'rejected') {
        throw new Error('Upload failed');
      }
      const imageUrl = `/api/storage/${storageId}?token=${encodeURIComponent(
        finalization.previewToken
      )}`;
      form.setValue(`projects.${index}.images`, [...currentImages, imageUrl], {
        shouldDirty: true,
      });
      toast.success('Project image uploaded.');
    } catch {
      toast.error('Could not upload project image. Try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async (imageIndex: number) => {
    const currentImages = form.getValues(`projects.${index}.images`) || [];
    const image = currentImages[imageIndex];
    form.setValue(
      `projects.${index}.images`,
      currentImages.filter((_, currentIndex) => currentIndex !== imageIndex),
      { shouldDirty: true }
    );
    const storageId = image?.match(
      /^\/api\/storage\/([^/?#]+)(?:\?token=[A-Za-z0-9_-]{48})?$/
    )?.[1];
    if (storageId) {
      try {
        await deleteImage({ storageId: storageId as Id<'_storage'> });
      } catch {
        // Saved references are intentionally retained until the profile is saved.
      }
    }
  };

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
    isUploading,
    removeImage,
    removeTechnology,
    uploadImage,
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
  const {
    addTechnology,
    isUploading,
    removeImage,
    removeTechnology,
    uploadImage,
  } = useProjectEntryCommands(form, index);

  return (
    <SortableItem id={fieldKey}>
      {({ attributes, listeners }) => (
        <div className="rounded-xl p-5 bg-card border border-white/10 space-y-4">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <button
                type="button"
                aria-label={`Reorder project ${index + 1}`}
                className="text-muted-foreground cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="w-4 h-4" />
              </button>
              Project
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
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
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
                      className="h-4 w-4 rounded border-input"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">
                    Featured project
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Images (max 3)</FormLabel>
            <div className="flex gap-2 flex-wrap">
              {images.map((image, imageIndex) => (
                <div
                  key={imageIndex}
                  className="relative w-20 h-20 rounded-md overflow-hidden border bg-muted"
                >
                  <img
                    src={image}
                    alt={`Project image ${imageIndex + 1}`}
                    width={80}
                    height={80}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`Remove project image ${imageIndex + 1}`}
                    onClick={() => void removeImage(imageIndex)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < MAX_PROJECT_IMAGES && (
                <label
                  aria-busy={isUploading}
                  className={cn(
                    'w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors focus-within:ring-2 focus-within:ring-ring',
                    isUploading && 'opacity-50'
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    aria-label={`Upload an image for project ${index + 1}`}
                    className="sr-only"
                    disabled={isUploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadImage(file);
                      event.target.value = '';
                    }}
                  />
                  {isUploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
                      <span className="sr-only">Uploading image</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-muted-foreground" />
                      <span className="sr-only">Choose project image</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel>Technologies</FormLabel>
            <div className="flex gap-1.5 flex-wrap">
              {technologies.map((technology, technologyIndex) => (
                <span
                  key={technologyIndex}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs"
                >
                  {technology}
                  <button
                    type="button"
                    aria-label={`Remove ${technology} technology`}
                    onClick={() => removeTechnology(technologyIndex)}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tech..."
                className="w-24 px-2 py-0.5 text-xs rounded-full border bg-transparent"
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
}
