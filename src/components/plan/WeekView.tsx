import { useState } from "react";

import { useNavigate, useRouter } from "@tanstack/react-router";

import type { ChainWithEvents } from "@/lib/server/chains";
import { getLocalToday, getWeekDates } from "@/lib/time";

import { CopyFromWeekDialog } from "./CopyFromWeekDialog";
import { CopyToWeekDialog } from "./CopyToWeekDialog";
import { DayColumn } from "./DayColumn";
import { WeekNavigation } from "./WeekNavigation";

type WeekViewProps = {
  weekStart: string; // Monday ISO date
  chainsByDay: Record<string, ChainWithEvents[]>; // keyed by ISO date
};

export function WeekView({ weekStart, chainsByDay }: WeekViewProps) {
  const router = useRouter();
  const navigate = useNavigate();
  const [copyFromOpen, setCopyFromOpen] = useState(false);
  const [copyToOpen, setCopyToOpen] = useState(false);

  const weekDates = getWeekDates(weekStart);

  function handleUpdate() {
    router.invalidate();
  }

  return (
    <div className="flex flex-col">
      <WeekNavigation
        weekStart={weekStart}
        onCopyFromWeek={() => setCopyFromOpen(true)}
        onCopyToWeek={() => setCopyToOpen(true)}
      />

      {/* Desktop: 7-column grid */}
      <main className="flex-1 overflow-x-auto">
        {/* Desktop layout */}
        <div className="hidden items-start md:grid md:grid-cols-7 md:divide-x md:divide-[var(--rule)]">
          {weekDates.map((date) => (
            <DayColumn
              key={date}
              date={date}
              chains={chainsByDay[date] ?? []}
              onUpdate={handleUpdate}
            />
          ))}
        </div>

        {/* Mobile layout */}
        <div className="px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden">
          <p className="mb-4 text-center text-sm font-medium text-[var(--ink-soft)]">
            Switch to desktop for week view. Tap a day below:
          </p>
          <div className="flex flex-col gap-2">
            {weekDates.map((date) => {
              const d = new Date(`${date}T12:00:00Z`);
              const today = getLocalToday();
              const isToday = date === today;
              const label = d.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              });
              const chainCount = (chainsByDay[date] ?? []).length;

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() =>
                    navigate({ to: "/plan/$date", params: { date } })
                  }
                  className={[
                    "flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 text-left transition-all",
                    isToday
                      ? "border-[var(--terracotta)] bg-[var(--paper)] font-semibold"
                      : "border-[var(--rule)] bg-[var(--white)] hover:border-[var(--terracotta)]",
                  ].join(" ")}
                >
                  <span
                    className={
                      isToday ? "text-[var(--terracotta)]" : "text-[var(--ink)]"
                    }
                  >
                    {label}
                    {isToday && (
                      <span className="ml-1.5 text-xs font-normal text-[var(--terracotta)]">
                        Today
                      </span>
                    )}
                  </span>
                  {chainCount > 0 && (
                    <span className="text-xs text-[var(--ink-soft)]">
                      {chainCount} {chainCount === 1 ? "chain" : "chains"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <CopyFromWeekDialog
        open={copyFromOpen}
        onOpenChange={setCopyFromOpen}
        targetWeekStart={weekStart}
        onSuccess={handleUpdate}
      />

      <CopyToWeekDialog
        open={copyToOpen}
        onOpenChange={setCopyToOpen}
        sourceWeekStart={weekStart}
        onSuccess={handleUpdate}
      />
    </div>
  );
}
