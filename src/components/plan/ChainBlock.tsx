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

  const directionLabel =
    chain.direction === "backward"
      ? `← ${formatDisplayTime(chain.anchorTime)}`
      : `→ ${formatDisplayTime(chain.anchorTime)}`;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[linear-gradient(165deg,var(--surface-strong),var(--surface))] shadow-[0_1px_0_var(--inset-glint)_inset,0_4px_16px_rgba(23,58,64,0.07)]">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
          <span className="flex-1 truncate text-sm font-bold text-[var(--sea-ink)]">
            {chain.name}
          </span>

          {/* Anchor time badge */}
          <span className="shrink-0 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--lagoon-deep)]">
            {directionLabel}
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
            <p className="px-2 py-3 text-sm text-[var(--sea-ink-soft)]">
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

        {/* Footer */}
        <div className="border-t border-[var(--line)] px-4 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-1.5 text-xs text-[var(--lagoon-deep)] hover:bg-[rgba(79,184,178,0.1)]"
            onClick={() => setAddEventOpen(true)}
          >
            <Plus className="size-3.5" />
            Add event
          </Button>
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
