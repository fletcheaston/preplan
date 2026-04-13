import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ChainWithEvents } from "@/lib/server/chains";

import { AddChainDialog } from "./AddChainDialog";
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

  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;

  const { abbrev, day } = formatDayHeader(date);

  function handleHeaderClick() {
    navigate({ to: "/plan/$date", params: { date } });
  }

  return (
    <div
      className={[
        "flex min-h-0 flex-col rounded-xl border transition-colors",
        isToday
          ? "border-[var(--lagoon)] bg-[rgba(79,184,178,0.06)]"
          : "border-[var(--line)] bg-[rgba(255,255,255,0.18)]",
      ].join(" ")}
    >
      {/* Day header */}
      <button
        type="button"
        onClick={handleHeaderClick}
        className={[
          "flex cursor-pointer flex-col items-center justify-center rounded-t-xl border-b py-2 transition-colors",
          isToday
            ? "border-[var(--lagoon)] bg-[rgba(79,184,178,0.12)] hover:bg-[rgba(79,184,178,0.18)]"
            : "border-[var(--line)] hover:bg-[rgba(79,184,178,0.07)]",
        ].join(" ")}
        aria-label={`Go to ${date} day view`}
      >
        <span
          className={[
            "text-[10px] font-semibold tracking-wide uppercase",
            isToday
              ? "text-[var(--lagoon-deep)]"
              : "text-[var(--sea-ink-soft)]",
          ].join(" ")}
        >
          {abbrev}
        </span>
        <span
          className={[
            "text-lg leading-none font-bold",
            isToday ? "text-[var(--lagoon-deep)]" : "text-[var(--sea-ink)]",
          ].join(" ")}
        >
          {day}
        </span>
      </button>

      {/* Chain cards */}
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-1.5">
        {chains.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-4">
            <span className="text-center text-[10px] leading-relaxed text-[var(--sea-ink-soft)]">
              No chains
            </span>
          </div>
        ) : (
          chains.map((chain) => (
            <DayColumnChainCard key={chain.id} chain={chain} date={date} />
          ))
        )}
      </div>

      {/* Add chain button */}
      <div className="border-t border-[var(--line)] p-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full justify-center gap-1 text-[10px] text-[var(--lagoon-deep)] hover:bg-[rgba(79,184,178,0.1)]"
          onClick={() => setAddChainOpen(true)}
          aria-label={`Add chain for ${date}`}
        >
          <Plus className="size-3" />
          Add
        </Button>
      </div>

      <AddChainDialog
        open={addChainOpen}
        onOpenChange={setAddChainOpen}
        date={date}
        onSuccess={onUpdate}
      />
    </div>
  );
}
