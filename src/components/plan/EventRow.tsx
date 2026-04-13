import { useState } from "react";

import { GripVertical, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Event } from "@/db/schema";
import { $deleteEvent } from "@/lib/server/events";
import { formatDisplayTime, formatDuration } from "@/lib/time";

import { EditEventDialog } from "./EditEventDialog";

type EventRowProps = {
  event: Event;
  derivedStartTime: string; // "HH:MM"
  derivedEndTime: string; // "HH:MM"
  derivedStartDay: string; // ISO date
  derivedEndDay: string; // ISO date
  chainDate: string; // The chain's day
  onUpdate: () => void;
};

export function EventRow({
  event,
  derivedStartTime,
  derivedEndTime,
  derivedStartDay,
  derivedEndDay,
  chainDate,
  onUpdate,
}: EventRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isCrossMidnight =
    derivedStartDay !== chainDate || derivedEndDay !== chainDate;
  const isPrevDay = derivedStartDay < chainDate;
  const isNextDay = derivedEndDay > chainDate;

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
      <div className="group flex min-h-[44px] items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-[rgba(79,184,178,0.06)]">
        {/* Drag handle stub */}
        <div
          data-drag-handle
          className="flex shrink-0 cursor-grab items-center text-[var(--sea-ink-soft)] opacity-40 group-hover:opacity-70"
        >
          <GripVertical className="size-4" />
        </div>

        {/* Event name */}
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-[var(--sea-ink)]">
            {event.name}
          </span>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {/* Duration chip */}
            <span className="inline-flex items-center rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-2 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
              {formatDuration(event.durationMinutes)}
            </span>
            {/* Time display */}
            <span className="text-xs text-[var(--sea-ink-soft)]">
              {formatDisplayTime(derivedStartTime)} →{" "}
              {formatDisplayTime(derivedEndTime)}
            </span>
            {/* Cross-midnight indicators */}
            {isCrossMidnight && (
              <span className="text-xs font-medium text-[var(--lagoon-deep)]">
                {isPrevDay && "↑ prev day"}
                {isNextDay && !isPrevDay && "↓ next day"}
                {isPrevDay && isNextDay && "↑↓ multi-day"}
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
