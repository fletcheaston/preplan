import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addDays } from "@/lib/time";

type DayNavigationProps = {
  date: string; // ISO date YYYY-MM-DD
};

function formatDisplayDate(isoDate: string): string {
  // Use T12:00:00Z to avoid DST issues
  const d = new Date(`${isoDate}T12:00:00Z`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function DayNavigation({ date }: DayNavigationProps) {
  const navigate = useNavigate();
  const [showPicker, setShowPicker] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const prevDay = addDays(date, -1);
  const nextDay = addDays(date, 1);

  function goTo(d: string) {
    navigate({ to: "/plan/$date", params: { date: d } });
  }

  return (
    <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 py-3 backdrop-blur-md">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => goTo(prevDay)}
        aria-label="Previous day"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="relative flex-1 text-center">
        <button
          className="rounded-md px-2 py-1 text-sm font-semibold text-[var(--sea-ink)] transition-colors hover:bg-[rgba(79,184,178,0.1)]"
          onClick={() => setShowPicker((v) => !v)}
        >
          {formatDisplayDate(date)}
        </button>

        {showPicker && (
          <div className="absolute top-full left-1/2 z-50 mt-1 -translate-x-1/2 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-3 shadow-lg">
            <input
              type="date"
              value={date}
              className="rounded-md border border-[var(--line)] bg-transparent px-2 py-1 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
              onChange={(e) => {
                if (e.target.value) {
                  setShowPicker(false);
                  goTo(e.target.value);
                }
              }}
            />
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => goTo(nextDay)}
        aria-label="Next day"
      >
        <ChevronRight className="size-4" />
      </Button>

      {date !== today && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(today)}
          className="ml-1 text-xs"
        >
          Today
        </Button>
      )}
    </div>
  );
}
