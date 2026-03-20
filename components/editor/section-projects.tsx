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
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '@/components/editor/sortable-item';
import { GripVertical, X, Plus, ImageIcon, Star } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { Fragment, useState, useRef } from 'react';
import type { ProfileUpdateFormValues } from '@/lib/types';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';

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

export function SectionProjects({
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
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleImageUpload = async (index: number, file: File) => {
    const currentImages = form.getValues(`projects.${index}.images`) || [];
    if (currentImages.length >= 3) return;

    setUploadingIndex(index);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await result.json();
      const imageUrl = `/api/storage/${storageId}`;
      form.setValue(`projects.${index}.images`, [...currentImages, imageUrl]);
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeImage = (index: number, imageIndex: number) => {
    const currentImages = form.getValues(`projects.${index}.images`) || [];
    form.setValue(
      `projects.${index}.images`,
      currentImages.filter((_, i) => i !== imageIndex)
    );
  };

  const addTechTag = (index: number, tag: string) => {
    const current = form.getValues(`projects.${index}.technologies`) || [];
    if (tag && !current.includes(tag)) {
      form.setValue(`projects.${index}.technologies`, [...current, tag]);
    }
  };

  const removeTechTag = (index: number, tagIndex: number) => {
    const current = form.getValues(`projects.${index}.technologies`) || [];
    form.setValue(
      `projects.${index}.technologies`,
      current.filter((_, i) => i !== tagIndex)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-foreground">Projects</h3>
        <Button type="button" onClick={onAdd}>
          Add Project
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
              const images = form.watch(`projects.${index}.images`) || [];
              const technologies =
                form.watch(`projects.${index}.technologies`) || [];
              const isFeatured = form.watch(`projects.${index}.isFeatured`);

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
                          Project
                          {isFeatured && (
                            <Star className="w-4 h-4 text-primary fill-primary" />
                          )}
                        </h4>
                      </div>

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

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`projects.${index}.category`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <FormControl>
                                <select
                                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                  value={f.value || ''}
                                  onChange={f.onChange}
                                >
                                  <option value="">Select category</option>
                                  {PROJECT_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
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
                          render={({ field: f }) => (
                            <FormItem className="flex items-end gap-2">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={f.value || false}
                                  onChange={(e) => f.onChange(e.target.checked)}
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
                          {images.map((img: string, imgIndex: number) => (
                            <div
                              key={imgIndex}
                              className="relative w-20 h-20 rounded-md overflow-hidden border bg-muted"
                            >
                              <img
                                src={img}
                                alt={`Project image ${imgIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index, imgIndex)}
                                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {images.length < 3 && (
                            <label
                              className={cn(
                                'w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors',
                                uploadingIndex === index && 'opacity-50'
                              )}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingIndex === index}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(index, file);
                                }}
                              />
                              {uploadingIndex === index ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
                              ) : (
                                <Plus className="w-5 h-5 text-muted-foreground" />
                              )}
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <FormLabel>Technologies</FormLabel>
                        <div className="flex gap-1.5 flex-wrap">
                          {technologies.map(
                            (tech: string, techIndex: number) => (
                              <span
                                key={techIndex}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs"
                              >
                                {tech}
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeTechTag(index, techIndex)
                                  }
                                  className="hover:text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            )
                          )}
                          <input
                            type="text"
                            placeholder="Add tech..."
                            className="w-24 px-2 py-0.5 text-xs rounded-full border bg-transparent"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const value = (
                                  e.target as HTMLInputElement
                                ).value.trim();
                                if (value) {
                                  addTechTag(index, value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                        </div>
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
