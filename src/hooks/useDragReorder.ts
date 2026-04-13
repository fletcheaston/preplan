import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { useEffect, useState } from "react";

import type { Event } from "@/db/schema";

type UseDragReorderOptions = {
  chainId: string;
  userId: string;
  events: Event[];
  onReorder: (newOrder: Event[]) => void;
  onReorderComplete: (orderedIds: string[]) => void;
};

export function useDragReorder({
  events,
  onReorder,
  onReorderComplete,
}: UseDragReorderOptions) {
  const [items, setItems] = useState<Event[]>(events);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync internal state when events prop changes externally
  useEffect(() => {
    setItems(events);
  }, [events]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(id: string) {
    setActiveId(id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(items, oldIndex, newIndex);
    setItems(newOrder);
    onReorder(newOrder);
    onReorderComplete(newOrder.map((item) => item.id));
  }

  return {
    sensors,
    handleDragStart,
    handleDragEnd,
    activeId,
    items,
  };
}
