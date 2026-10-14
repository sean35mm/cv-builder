'use client';

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFormState, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import type { ProfileForm } from '@/components/editor/fields';
import type { ProfileFieldArrayController } from '@/components/editor/hooks/use-profile-field-arrays';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { EntrySection } from '@/components/workspace/draft';
import { cn } from '@/lib/utils';

type EntryListProps<TEntry> = {
  form: ProfileForm;
  name: EntrySection;
  noun: string;
  controller: ProfileFieldArrayController<TEntry>;
  summarize: (entry: TEntry) => string;
  children: (index: number) => ReactNode;
};

const imageCount = (entry: object): number =>
  'images' in entry && Array.isArray(entry.images) ? entry.images.length : 0;

// Focus a control inside an entry after React has re-rendered the list.
const focusInEntry = (fieldKey: string, selector: string) => {
  requestAnimationFrame(() => {
    const entry = document.querySelector(`[data-entry="${fieldKey}"]`);
    const target = entry?.querySelector(selector);
    if (target instanceof HTMLElement) target.focus();
  });
};

export function EntryList<TEntry extends { id: string }>({
  form,
  name,
  noun,
  controller,
  summarize,
  children,
}: EntryListProps<TEntry>) {
  const { fields } = controller;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );
  const { errors } = useFormState({ control: form.control, name });
  const rootError = (
    errors[name] as { root?: { message?: string } } | undefined
  )?.root?.message;
  const focusNewEntry = useRef(false);
  const [confirming, setConfirming] = useState<{
    id: string;
    label: string;
    images: number;
  } | null>(null);

  useEffect(() => {
    if (!focusNewEntry.current) return;
    focusNewEntry.current = false;
    const last = fields.at(-1);
    if (last) focusInEntry(last.fieldKey, 'input, textarea, select');
  }, [fields]);

  const add = () => {
    focusNewEntry.current = true;
    controller.add();
  };

  const entries = () => form.getValues(name) as unknown as TEntry[];

  const removeNow = (id: string, label: string, undoable: boolean) => {
    const index = entries().findIndex((entry) => entry.id === id);
    if (index === -1) return;
    const removed = entries()[index];
    controller.remove(index);
    if (!undoable) {
      toast(`Removed ${label}`);
      return;
    }
    toast(`Removed ${label}`, {
      action: {
        label: 'Undo',
        onClick: () => {
          const current = entries();
          if (current.some((entry) => entry.id === id)) return;
          controller.replace([
            ...current.slice(0, index),
            removed,
            ...current.slice(index),
          ]);
        },
      },
    });
  };

  // Saving a removal deletes the entry's uploaded images on the server, so
  // an entry with images can't be undone; confirm instead.
  const remove = (index: number) => {
    const entry = entries()[index];
    const label = summarize(entry) || `Untitled ${noun}`;
    const images = imageCount(entry);
    if (images > 0) setConfirming({ id: entry.id, label, images });
    else removeNow(entry.id, label, true);
  };

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= fields.length) return;
    controller.move(index, target);
    focusInEntry(
      fields[index].fieldKey,
      `[data-move="${offset < 0 ? 'up' : 'down'}"]`
    );
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((field) => field.fieldKey === active.id);
    const to = fields.findIndex((field) => field.fieldKey === over.id);
    if (from !== -1 && to !== -1) controller.move(from, to);
  };

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 border-y border-border py-6">
        <p className="text-[13px] text-muted-foreground">
          Nothing here yet. Sections without entries stay off your profile.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus aria-hidden="true" />
          Add {noun}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={fields.map((field) => field.fieldKey)}
          strategy={verticalListSortingStrategy}
        >
          <ol className="divide-y divide-border border-y border-border">
            {fields.map((field, index) => (
              <EntryRow
                key={field.fieldKey}
                fieldKey={field.fieldKey}
                index={index}
                count={fields.length}
                form={form}
                name={name}
                noun={noun}
                summarize={summarize}
                onMove={move}
                onRemove={remove}
              >
                {children(index)}
              </EntryRow>
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {rootError && (
        <p role="alert" className="mt-2 text-[12px] text-destructive">
          {rootError}
        </p>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 -ml-2.5"
        onClick={add}
      >
        <Plus aria-hidden="true" />
        Add {noun}
      </Button>
      <Dialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              Remove this {noun} and its{' '}
              {confirming?.images === 1
                ? 'image'
                : `${confirming?.images ?? 0} images`}
              ?
            </DialogTitle>
            <DialogDescription>
              {confirming?.label} and its uploaded images are deleted when your
              profile saves. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirming) {
                  removeNow(confirming.id, confirming.label, false);
                }
                setConfirming(null);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EntryRow<TEntry>({
  fieldKey,
  index,
  count,
  form,
  name,
  noun,
  summarize,
  onMove,
  onRemove,
  children,
}: {
  fieldKey: string;
  index: number;
  count: number;
  form: ProfileForm;
  name: EntrySection;
  noun: string;
  summarize: (entry: TEntry) => string;
  onMove: (index: number, offset: -1 | 1) => void;
  onRemove: (index: number) => void;
  children: ReactNode;
}) {
  const { listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: fieldKey });
  const entry = useWatch({
    control: form.control,
    name: `${name}.${index}`,
  }) as TEntry | undefined;
  const summary = entry ? summarize(entry) : '';
  const label = summary || `Untitled ${noun}`;

  return (
    <li
      ref={setNodeRef}
      data-entry={fieldKey}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'group/entry relative bg-background py-4',
        isDragging && 'z-10 opacity-80'
      )}
    >
      <div className="mb-3 flex h-7 items-center gap-1">
        {/* Pointer-only handle; the move buttons cover keyboard and touch. */}
        <span
          aria-hidden="true"
          className="-ml-1.5 flex size-6 cursor-grab touch-none items-center justify-center rounded text-subtle hover:text-muted-foreground active:cursor-grabbing pointer-coarse:hidden"
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </span>
        <h3
          className={cn(
            'min-w-0 flex-1 truncate text-[13px] font-medium',
            summary ? 'text-foreground' : 'text-subtle'
          )}
        >
          {label}
        </h3>
        <div className="flex items-center opacity-0 transition-opacity duration-150 ease-out group-hover/entry:opacity-100 group-focus-within/entry:opacity-100 pointer-coarse:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            data-move="up"
            aria-label={`Move ${label} up`}
            aria-disabled={index === 0}
            className="aria-disabled:opacity-40"
            onClick={() => onMove(index, -1)}
          >
            <ArrowUp className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            data-move="down"
            aria-label={`Move ${label} down`}
            aria-disabled={index === count - 1}
            className="aria-disabled:opacity-40"
            onClick={() => onMove(index, 1)}
          >
            <ArrowDown className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${label}`}
            className="hover:text-destructive"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </li>
  );
}
