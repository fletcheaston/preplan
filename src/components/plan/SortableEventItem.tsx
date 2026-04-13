import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useState } from "react";

import { GripVertical, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Event } from "@/db/schema";
import { $deleteEvent } from "@/lib/server/events";
import { formatDisplayTime, formatDuration } from "@/lib/time";
import type { DerivedEvent } from "@/lib/time";

import { EditEventDialog } from "./EditEventDialog";

type SortableEventItemProps = {
  event: Event;
  derivedEvent: DerivedEvent;
  chainDate: string;
  onUpdate: () => void;
};

export function SortableEventItem({
  event,
  derivedEvent,
  chainDate,
  onUpdate,
}: SortableEventItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const isCrossMidnight =
    derivedEvent.startDay !== chainDate || derivedEvent.endDay !== chainDate;
  const isPrevDay = derivedEvent.startDay < chainDate;
  const isNextDay = derivedEvent.endDay > chainDate;

  async function handleDelete() {
    if (!window.confirm(`Delete "${event.name}"?`)) return;
    setDeleting(true);
    try {
      await $deleteEvent({ data: { eventId: event.id } });
      onUpdate();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="group flex min-h-[44px] items-center gap-2 border-b border-[var(--rule-light)] px-2 py-2 last:border-b-0"
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          data-drag-handle
          className="flex shrink-0 cursor-grab items-center text-[var(--ink-soft)] opacity-30 group-hover:opacity-60 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </div>

        {/* Event name */}
        <div className="min-w-0 flex-1">
          <span className="block truncate text-base font-medium text-[var(--ink)]">
            {event.name}
          </span>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {/* Duration as inline mono text */}
            <span className="font-mono text-sm text-[var(--ink-soft)]">
              {formatDuration(event.durationMinutes)}
            </span>
            {/* Time display in mono */}
            <span className="font-mono text-sm text-[var(--ink-soft)]">
              {formatDisplayTime(derivedEvent.startTime)} {"\u2192"}{" "}
              {formatDisplayTime(derivedEvent.endTime)}
            </span>
            {/* Cross-midnight indicators */}
            {isCrossMidnight && (
              <span className="text-xs font-medium text-[var(--terracotta)]">
                {isPrevDay && "\u2191 prev day"}
                {isNextDay && !isPrevDay && "\u2193 next day"}
                {isPrevDay && isNextDay && "\u2191\u2193 multi-day"}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setEditOpen(true)}
            aria-label={`Edit ${event.name}`}
          >
            <Pencil className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDelete}
            disabled={deleting}
            aria-label={`Delete ${event.name}`}
            className="hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>

      <EditEventDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        event={event}
        onSuccess={onUpdate}
      />
    </>
  );
}
