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
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState, type ComponentProps, type KeyboardEvent } from 'react';
import { useWatch } from 'react-hook-form';

import type { ProfileForm } from '@/components/editor/fields';
import {
  getDraggableSectionOrder,
  SECTION_LABELS,
} from '@/components/editor/profile-editor-config';
import { Button } from '@/components/ui/button';
import type { SectionId } from '@/lib/profile/domain';
import { resolveSectionsOrder } from '@/lib/profile/editor';
import { cn } from '@/lib/utils';

const COUNTED_SECTIONS = [
  'experience',
  'education',
  'skills',
  'languages',
  'projects',
  'publications',
  'certifications',
  'volunteering',
  'exhibitions',
  'awards',
  'interests',
] as const;

// The nav renders in the sidebar and, on small screens, in a popover; focus
// whichever copy is visible.
const focusSection = (section: SectionId) => {
  requestAnimationFrame(() => {
    const buttons = document.querySelectorAll<HTMLElement>(
      `[data-section-button="${section}"]`
    );
    Array.from(buttons)
      .find((button) => button.offsetParent !== null)
      ?.focus();
  });
};

export function SectionNav({
  form,
  active,
  onSelect,
  onReorder,
}: {
  form: ProfileForm;
  active: SectionId;
  onSelect: (section: SectionId) => void;
  onReorder: (order: SectionId[]) => void;
}) {
  const sectionsOrder = useWatch({
    control: form.control,
    name: 'sectionsOrder',
  });
  const counted = useWatch({ control: form.control, name: COUNTED_SECTIONS });
  const counts = Object.fromEntries(
    COUNTED_SECTIONS.map((section, index) => [
      section,
      (counted[index] as unknown[] | undefined)?.length ?? 0,
    ])
  ) as Partial<Record<SectionId, number>>;
  const order = getDraggableSectionOrder(resolveSectionsOrder(sectionsOrder));
  const all: SectionId[] = ['header', ...order];
  const [announcement, setAnnouncement] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const move = (section: SectionId, offset: -1 | 1) => {
    const from = order.indexOf(section);
    const to = from + offset;
    if (from === -1 || to < 0 || to >= order.length) return;
    onReorder(arrayMove(order, from, to));
    setAnnouncement(
      `${SECTION_LABELS[section]} moved to position ${to + 1} of ${order.length}`
    );
    focusSection(section);
  };

  const onKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    section: SectionId
  ) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const offset = event.key === 'ArrowUp' ? -1 : 1;
    if (event.altKey) {
      move(section, offset);
      return;
    }
    const next = all[all.indexOf(section) + offset];
    if (next) focusSection(next);
  };

  const onDragEnd = ({ active: dragged, over }: DragEndEvent) => {
    if (!over || dragged.id === over.id) return;
    const from = order.indexOf(dragged.id as SectionId);
    const to = order.indexOf(over.id as SectionId);
    if (from !== -1 && to !== -1) onReorder(arrayMove(order, from, to));
  };

  const row = (section: SectionId) => ({
    section,
    label: SECTION_LABELS[section],
    count: counts[section],
    selected: section === active,
    onSelect: () => onSelect(section),
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) =>
      onKeyDown(event, section),
  });

  return (
    <nav aria-label="Sections">
      <ul>
        <SectionRow {...row('header')} />
      </ul>
      <div className="mx-2 my-2 h-px bg-border" />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ul>
            {order.map((section, index) => (
              <SortableSectionRow
                key={section}
                {...row(section)}
                isFirst={index === 0}
                isLast={index === order.length - 1}
                onMove={(offset) => move(section, offset)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <p className="mt-3 px-2 text-[12px] leading-5 text-subtle pointer-coarse:hidden">
        Drag to reorder, or{' '}
        <kbd className="font-mono text-[11px] text-muted-foreground">
          Alt ↑↓
        </kbd>
      </p>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </nav>
  );
}

type RowProps = {
  section: SectionId;
  label: string;
  count?: number;
  selected: boolean;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
};

function SectionButton({
  section,
  label,
  count,
  selected,
  onSelect,
  onKeyDown,
  className,
  ...rest
}: RowProps & Omit<ComponentProps<'button'>, keyof RowProps | 'type'>) {
  return (
    <button
      type="button"
      data-section-button={section}
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        'flex h-8 min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 text-left text-[13px] transition-colors duration-150 ease-out pointer-coarse:h-11',
        selected
          ? 'bg-secondary font-medium text-foreground'
          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
        className
      )}
      {...rest}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'font-mono text-[11.5px] tabular-nums',
            count === 0 ? 'text-subtle/70' : 'text-subtle'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function SectionRow(props: RowProps) {
  return (
    <li className="flex">
      <SectionButton {...props} />
    </li>
  );
}

function SortableSectionRow({
  isFirst,
  isLast,
  onMove,
  ...props
}: RowProps & {
  isFirst: boolean;
  isLast: boolean;
  onMove: (offset: -1 | 1) => void;
}) {
  const { listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.section });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'relative flex items-center gap-0.5',
        isDragging && 'z-10 rounded-md bg-surface shadow-popover'
      )}
    >
      <SectionButton
        {...props}
        {...listeners}
        aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
        className="cursor-default active:cursor-grabbing"
      />
      <div className="hidden pointer-coarse:flex">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Move ${props.label} up`}
          aria-disabled={isFirst}
          className="aria-disabled:opacity-40"
          onClick={() => onMove(-1)}
        >
          <ArrowUp className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Move ${props.label} down`}
          aria-disabled={isLast}
          className="aria-disabled:opacity-40"
          onClick={() => onMove(1)}
        >
          <ArrowDown className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
