import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { addDays } from "@/lib/time";

type DayNavigationProps = {
  date: string; // ISO date YYYY-MM-DD
};

function parseDateParts(isoDate: string): {
  dayNum: number;
  weekday: string;
  monthYear: string;
} {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return {
    dayNum: d.getUTCDate(),
    weekday: d.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }),
    monthYear: d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
  };
}

export function DayNavigation({ date }: DayNavigationProps) {
  const navigate = useNavigate();
  const [showPicker, setShowPicker] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const prevDay = addDays(date, -1);
  const nextDay = addDays(date, 1);

  const { dayNum, weekday, monthYear } = parseDateParts(date);

  function goTo(d: string) {
    navigate({ to: "/plan/$date", params: { date: d } });
  }

  return (
    <div className="flex items-center gap-3 border-b border-[var(--rule)] bg-[var(--header-bg)] px-4 py-3 backdrop-blur-sm">
      <button
        className="cursor-pointer bg-transparent font-mono text-lg text-[var(--ink-soft)] hover:text-[var(--ink)]"
        onClick={() => goTo(prevDay)}
        aria-label="Previous day"
      >
        {"\u2190"}
      </button>

      <div className="relative flex-1 text-center">
        <button
          className="cursor-pointer bg-transparent px-2 py-1 transition-colors hover:text-[var(--terracotta)]"
          onClick={() => setShowPicker((v) => !v)}
        >
          <span className="block text-4xl leading-none font-bold text-[var(--ink)]">
            {dayNum}
          </span>
          <span className="mt-1 block text-base text-[var(--ink-soft)]">
            {weekday}
          </span>
          <span className="block text-sm text-[var(--ink-soft)]">
            {monthYear}
          </span>
        </button>

        {showPicker && (
          <div className="absolute top-full left-1/2 z-50 mt-1 -translate-x-1/2 rounded-lg border border-[var(--rule)] bg-[var(--white)] p-3 shadow-md">
            <input
              type="date"
              value={date}
              className="rounded border border-[var(--rule)] bg-transparent px-2 py-1 font-mono text-sm text-[var(--ink)] outline-none focus:border-[var(--terracotta)]"
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

      <button
        className="cursor-pointer bg-transparent font-mono text-lg text-[var(--ink-soft)] hover:text-[var(--ink)]"
        onClick={() => goTo(nextDay)}
        aria-label="Next day"
      >
        {"\u2192"}
      </button>

      {date !== today && (
        <button
          className="cursor-pointer rounded-lg border border-[var(--rule)] bg-[var(--white)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] hover:border-[var(--terracotta)] hover:text-[var(--terracotta)]"
          onClick={() => goTo(today)}
        >
          Today
        </button>
      )}
    </div>
  );
}
