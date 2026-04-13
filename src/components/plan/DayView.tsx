import { useState } from "react";

import { useRouter } from "@tanstack/react-router";

import { Copy, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ChainWithEvents } from "@/lib/server/chains";

import { AddChainDialog } from "./AddChainDialog";
import { ChainBlock } from "./ChainBlock";
import { CopyDayDialog } from "./CopyDayDialog";
import { DayNavigation } from "./DayNavigation";

type DayViewProps = {
  date: string; // ISO date
  chains: ChainWithEvents[];
};

export function DayView({ date, chains }: DayViewProps) {
  const router = useRouter();
  const [addChainOpen, setAddChainOpen] = useState(false);
  const [copyDayOpen, setCopyDayOpen] = useState(false);

  function handleUpdate() {
    router.invalidate();
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <DayNavigation date={date} />

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {chains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="mb-2 text-base font-medium text-[var(--ink)]">
              No events planned for this day.
            </p>
            <p className="mb-6 text-sm text-[var(--ink-soft)]">
              Add a chain to get started.
            </p>
            <Button onClick={() => setAddChainOpen(true)} className="gap-2">
              <Plus className="size-4" />
              Add chain
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {chains.map((chainWithEvents) => (
              <ChainBlock
                key={chainWithEvents.id}
                chain={chainWithEvents}
                events={chainWithEvents.events}
                date={date}
                onUpdate={handleUpdate}
              />
            ))}

            <div className="flex gap-2 pt-2 pb-8">
              <Button
                variant="outline"
                className="flex-1 gap-2 border-dashed text-[var(--ink-soft)] hover:border-[var(--terracotta)] hover:text-[var(--terracotta)]"
                onClick={() => setAddChainOpen(true)}
              >
                <Plus className="size-4" />
                Add chain
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-dashed text-[var(--ink-soft)] hover:border-[var(--terracotta)] hover:text-[var(--terracotta)]"
                onClick={() => setCopyDayOpen(true)}
              >
                <Copy className="size-4" />
                Copy day
              </Button>
            </div>
          </div>
        )}
      </main>

      <AddChainDialog
        open={addChainOpen}
        onOpenChange={setAddChainOpen}
        date={date}
        onSuccess={handleUpdate}
      />

      <CopyDayDialog
        open={copyDayOpen}
        onOpenChange={setCopyDayOpen}
        targetDay={date}
        onSuccess={handleUpdate}
      />
    </div>
  );
}
