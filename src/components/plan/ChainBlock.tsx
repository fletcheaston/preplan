import { useState } from "react";

import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Chain, Event } from "@/db/schema";
import { $deleteChain, $triggerManualSync } from "@/lib/server/chains";
import { deriveEventTimes, formatDisplayTime } from "@/lib/time";

import { AddEventDialog } from "./AddEventDialog";
import { EditChainDialog } from "./EditChainDialog";
import { SortableEventList } from "./SortableEventList";

type ChainBlockProps = {
  chain: Chain;
  events: Event[];
  date: string;
  onUpdate: () => void;
};

export function ChainBlock({ chain, events, date, onUpdate }: ChainBlockProps) {
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [editChainOpen, setEditChainOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Sort events by sortOrder before deriving times
  const sortedEvents = [...events].sort((a, b) => a.sortOrder - b.sortOrder);
  const derivedEvents = deriveEventTimes(chain, sortedEvents);

  async function handleManualSync() {
    setSyncing(true);
    try {
      await $triggerManualSync({ data: { chainId: chain.id } });
    } finally {
      setSyncing(false);
    }
  }

  async function handleDeleteChain() {
    if (!window.confirm(`Delete chain "${chain.name}" and all its events?`))
      return;
    setDeleting(true);
    try {
      await $deleteChain({ data: { chainId: chain.id } });
      onUpdate();
    } finally {
      setDeleting(false);
    }
  }

  const isBackward = chain.direction === "backward";
  const directionChar = isBackward ? "\u2190" : "\u2192";
  const stripeColor = isBackward ? "var(--terracotta)" : "var(--sage)";

  return (
    <>
      <div
        className="overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--paper)]"
        style={{ borderLeft: `3px solid ${stripeColor}` }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[var(--rule-light)] px-4 py-3">
          <span className="flex-1 truncate text-base font-semibold text-[var(--ink)]">
            {chain.name}
          </span>

          {/* Anchor time in mono */}
          <span className="shrink-0 font-mono text-sm text-[var(--ink-soft)]">
            {directionChar} {formatDisplayTime(chain.anchorTime)}
          </span>

          {/* Sync chain to Google Calendar */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleManualSync}
            disabled={syncing}
            aria-label={`Sync chain ${chain.name} to Google Calendar`}
          >
            <RefreshCw className={`size-3 ${syncing ? "animate-spin" : ""}`} />
          </Button>

          {/* Edit chain */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setEditChainOpen(true)}
            aria-label={`Edit chain ${chain.name}`}
          >
            <Pencil className="size-3" />
          </Button>

          {/* Delete chain */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDeleteChain}
            disabled={deleting}
            aria-label={`Delete chain ${chain.name}`}
            className="hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>

        {/* Events list */}
        <div className="px-2 py-1">
          {sortedEvents.length === 0 ? (
            <p className="px-2 py-3 text-base text-[var(--ink-soft)]">
              No events yet. Add one below.
            </p>
          ) : (
            <SortableEventList
              chainId={chain.id}
              events={sortedEvents}
              derivedEvents={derivedEvents}
              chainDate={date}
              onUpdate={onUpdate}
            />
          )}
        </div>

        {/* Footer - plain text add link */}
        <div className="border-t border-[var(--rule-light)] px-4 py-2.5">
          <button
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 bg-transparent text-xs font-medium text-[var(--terracotta)] hover:underline"
            onClick={() => setAddEventOpen(true)}
          >
            <Plus className="size-4" />
            Add event
          </button>
        </div>
      </div>

      <AddEventDialog
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        chainId={chain.id}
        onSuccess={onUpdate}
      />

      <EditChainDialog
        open={editChainOpen}
        onOpenChange={setEditChainOpen}
        chain={chain}
        onSuccess={onUpdate}
      />
    </>
  );
}
