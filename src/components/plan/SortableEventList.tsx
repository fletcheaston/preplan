import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { GripVertical } from "lucide-react";

import type { Event } from "@/db/schema";
import { useDragReorder } from "@/hooks/useDragReorder";
import { $reorderEvents } from "@/lib/server/events";
import {
  deriveEventTimes,
  formatDisplayTime,
  formatDuration,
} from "@/lib/time";
import type { DerivedEvent } from "@/lib/time";

import { SortableEventItem } from "./SortableEventItem";

type SortableEventListProps = {
  chainId: string;
  events: Event[];
  derivedEvents: DerivedEvent[];
  chainDate: string;
  onUpdate: () => void;
};

export function SortableEventList({
  chainId,
  events,
  derivedEvents,
  chainDate,
  onUpdate,
}: SortableEventListProps) {
  const { sensors, handleDragStart, handleDragEnd, activeId, items } =
    useDragReorder({
      chainId,
      userId: "",
      events,
      onReorder: (_newOrder) => {
        // Optimistic update already applied in hook — nothing extra needed here
      },
      onReorderComplete: async (orderedIds) => {
        try {
          await $reorderEvents({
            data: { chainId, orderedEventIds: orderedIds },
          });
          onUpdate();
        } catch (err) {
          console.error("Failed to reorder events:", err);
          onUpdate(); // refresh to restore server state on error
        }
      },
    });

  const activeEvent = activeId ? items.find((e) => e.id === activeId) : null;

  // Recompute derived times based on current optimistic item order
  const optimisticDerivedEvents: DerivedEvent[] = items.map((item) => {
    const found = derivedEvents.find((d) => d.eventId === item.id);
    return (
      found ?? {
        eventId: item.id,
        name: item.name,
        durationMinutes: item.durationMinutes,
        startTime: "00:00",
        endTime: "00:00",
        startDay: chainDate,
        endDay: chainDate,
      }
    );
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => handleDragStart(String(active.id))}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((e) => e.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col">
          {items.map((event, index) => {
            const derived = optimisticDerivedEvents[index];
            if (!derived) return null;
            return (
              <SortableEventItem
                key={event.id}
                event={event}
                derivedEvent={derived}
                chainDate={chainDate}
                onUpdate={onUpdate}
              />
            );
          })}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeEvent ? (
          <DragOverlayItem event={activeEvent} chainDate={chainDate} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Simplified overlay shown while dragging
function DragOverlayItem({
  event,
  chainDate: _chainDate,
}: {
  event: Event;
  chainDate: string;
}) {
  return (
    <div className="flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--rule)] bg-[var(--paper)] px-2 py-2 shadow-md">
      <div className="flex shrink-0 cursor-grabbing items-center text-[var(--ink-soft)] opacity-60">
        <GripVertical className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[var(--ink)]">
          {event.name}
        </span>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--ink-soft)]">
            {formatDuration(event.durationMinutes)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Re-export for consumers that want to use the sortable list with chain-level derived time computation
export { deriveEventTimes, formatDisplayTime };
