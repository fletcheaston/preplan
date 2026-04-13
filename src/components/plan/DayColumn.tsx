import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { Copy, Plus } from "lucide-react";

import type { ChainWithEvents } from "@/lib/server/chains";

import { AddChainDialog } from "./AddChainDialog";
import { CopyDayDialog } from "./CopyDayDialog";
import { DayColumnChainCard } from "./DayColumnChainCard";

type DayColumnProps = {
  date: string; // ISO date
  chains: ChainWithEvents[];
  onUpdate: () => void;
};

const DAY_ABBREVS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDayHeader(isoDate: string): { abbrev: string; day: number } {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return {
    abbrev: DAY_ABBREVS[d.getUTCDay()],
    day: d.getUTCDate(),
  };
}

export function DayColumn({ date, chains, onUpdate }: DayColumnProps) {
  const navigate = useNavigate();
  const [addChainOpen, setAddChainOpen] = useState(false);
  const [copyDayOpen, setCopyDayOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;

  const { abbrev, day } = formatDayHeader(date);

  function handleHeaderClick() {
    navigate({ to: "/plan/$date", params: { date } });
  }

  return (
    <div className="flex flex-col">
      {/* Day header */}
      <button
        type="button"
        onClick={handleHeaderClick}
        className="flex cursor-pointer flex-col items-center justify-center border-b border-[var(--rule)] py-2 transition-colors hover:bg-[var(--paper)]"
        aria-label={`Go to ${date} day view`}
      >
        <span className="font-mono text-sm font-medium tracking-wider text-[var(--ink-soft)] uppercase">
          {abbrev}
        </span>
        <span
          className={[
            "text-xl leading-none font-bold",
            isToday
              ? "text-[var(--ink)] underline decoration-[var(--terracotta)] decoration-2 underline-offset-4"
              : "text-[var(--ink)]",
          ].join(" ")}
        >
          {day}
        </span>
      </button>

      {/* Chain cards */}
      <div className="flex flex-col gap-1.5 p-1.5">
        {chains.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <span className="text-center text-sm leading-relaxed text-[var(--ink-soft)]">
              No chains
            </span>
          </div>
        ) : (
          chains.map((chain) => (
            <DayColumnChainCard key={chain.id} chain={chain} date={date} />
          ))
        )}
      </div>

      {/* Action buttons */}
      <div className="flex border-t border-[var(--rule-light)] p-1.5">
        <button
          className="flex h-7 flex-1 cursor-pointer items-center justify-center gap-1 bg-transparent text-sm font-medium text-[var(--terracotta)] hover:underline"
          onClick={() => setAddChainOpen(true)}
          aria-label={`Add chain for ${date}`}
        >
          <Plus className="size-3" />
          Add
        </button>
        <button
          className="flex h-7 flex-1 cursor-pointer items-center justify-center gap-1 bg-transparent text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--terracotta)] hover:underline"
          onClick={() => setCopyDayOpen(true)}
          aria-label={`Copy chains to ${date}`}
        >
          <Copy className="size-3" />
          Copy
        </button>
      </div>

      <AddChainDialog
        open={addChainOpen}
        onOpenChange={setAddChainOpen}
        date={date}
        onSuccess={onUpdate}
      />

      <CopyDayDialog
        open={copyDayOpen}
        onOpenChange={setCopyDayOpen}
        targetDay={date}
        onSuccess={onUpdate}
      />
    </div>
  );
}
