'use client';

import type { CSSProperties, Dispatch, SetStateAction } from 'react';
import { closestCenter, DndContext } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

import {
  getDraggableSectionOrder,
  mergeDraggableSectionOrder,
  SECTION_LABELS,
} from '@/components/editor/profile-editor-config';
import { useSortableSensors } from '@/components/editor/sortable-item';
import type { SectionId } from '@/lib/profile/domain';

function SortableNavItem({
  id,
  section,
  selected,
  onSelect,
}: {
  id: string;
  section: SectionId;
  selected: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex min-h-11 select-none items-center border-b ${
        selected
          ? 'border-l-2 border-l-primary bg-secondary text-secondary-foreground'
          : 'text-foreground hover:bg-muted'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-h-11 min-w-0 flex-1 px-3 py-2 text-left text-sm"
      >
        {SECTION_LABELS[section]}
      </button>
      <button
        type="button"
        aria-label={`Reorder ${SECTION_LABELS[section]} section`}
        className="flex min-h-11 min-w-11 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
  );
}

function NavItem({
  section,
  selected,
  onSelect,
}: {
  section: SectionId;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="select-none">
      <button
        type="button"
        onClick={onSelect}
        className={`flex min-h-11 w-full items-center justify-between gap-3 border-b px-3 py-2 text-left ${
          selected
            ? 'bg-secondary text-secondary-foreground'
            : 'text-foreground hover:bg-muted'
        }`}
      >
        <span className="text-sm">{SECTION_LABELS[section]}</span>
      </button>
    </div>
  );
}

export function ProfileEditorNavigation({
  order,
  activeSection,
  setActiveSection,
  onReorder,
}: {
  order: ReadonlyArray<SectionId>;
  activeSection: SectionId;
  setActiveSection: Dispatch<SetStateAction<SectionId>>;
  onReorder: (order: SectionId[]) => void;
}) {
  const sensors = useSortableSensors();
  const draggableSections = getDraggableSectionOrder(order);
  const navIds = draggableSections.map((id) => `nav:${id}`);

  return (
    <div>
      <NavItem
        section="header"
        selected={activeSection === 'header'}
        onSelect={() => setActiveSection('header')}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (!over) return;
          const oldIndex = navIds.indexOf(String(active.id));
          const newIndex = navIds.indexOf(String(over.id));
          if (oldIndex === -1 || newIndex === -1) return;
          onReorder(
            mergeDraggableSectionOrder(
              order,
              arrayMove(draggableSections, oldIndex, newIndex)
            )
          );
        }}
      >
        <SortableContext items={navIds} strategy={verticalListSortingStrategy}>
          <div>
            {draggableSections.map((section) => (
              <SortableNavItem
                key={`nav:${section}`}
                id={`nav:${section}`}
                section={section}
                selected={activeSection === section}
                onSelect={() => setActiveSection(section)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
