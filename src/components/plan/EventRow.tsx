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
      <div className="group flex min-h-[44px] items-center gap-2 border-b border-[var(--rule-light)] px-2 py-2 last:border-b-0">
        {/* Drag handle stub */}
        <div
          data-drag-handle
          className="flex shrink-0 cursor-grab items-center text-[var(--ink-soft)] opacity-30 group-hover:opacity-60"
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
              {formatDisplayTime(derivedStartTime)} {"\u2192"}{" "}
              {formatDisplayTime(derivedEndTime)}
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
