import { useState } from "react";

import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { $copyWeek } from "@/lib/server/weeks";

type CopyWeekDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetWeekStart: string; // the current week (destination)
  onSuccess: () => void;
};

function getMondayOf(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}

function addWeeksDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatWeekRange(monday: string): string {
  const start = new Date(`${monday}T12:00:00Z`);
  const end = new Date(`${monday}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);

  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const endStr = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${startStr} – ${endStr}`;
}

function getPast8Weeks(targetWeekStart: string): string[] {
  // Start from the Monday BEFORE targetWeekStart and go back 8 weeks
  const weeks: string[] = [];
  let current = getMondayOf(addWeeksDays(targetWeekStart, -1));
  for (let i = 0; i < 8; i++) {
    weeks.push(current);
    current = addWeeksDays(current, -7);
  }
  return weeks;
}

export function CopyWeekDialog({
  open,
  onOpenChange,
  targetWeekStart,
  onSuccess,
}: CopyWeekDialogProps) {
  const pastWeeks = getPast8Weeks(targetWeekStart);
  const [selectedWeek, setSelectedWeek] = useState<string>(pastWeeks[0]);
  const [offsetMinutes, setOffsetMinutes] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    setLoading(true);
    setError(null);
    try {
      await $copyWeek({
        data: {
          sourceWeekStart: selectedWeek,
          targetWeekStart,
          offsetMinutes: offsetMinutes || undefined,
        },
      });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to copy week");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-xl">
          <DialogPrimitive.Title className="mb-1 text-base font-semibold text-[var(--sea-ink)]">
            Copy a past week
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mb-4 text-sm text-[var(--sea-ink-soft)]">
            Choose a past week to copy all its chains into the current week.
          </DialogPrimitive.Description>

          {/* Week list */}
          <div className="mb-4 flex max-h-60 flex-col gap-1.5 overflow-y-auto pr-0.5">
            {pastWeeks.map((monday) => {
              const isSelected = monday === selectedWeek;
              return (
                <button
                  key={monday}
                  type="button"
                  onClick={() => setSelectedWeek(monday)}
                  className={[
                    "flex cursor-pointer items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-all",
                    isSelected
                      ? "border-[var(--lagoon)] bg-[rgba(79,184,178,0.1)] font-semibold text-[var(--lagoon-deep)]"
                      : "border-[var(--line)] bg-[rgba(255,255,255,0.3)] text-[var(--sea-ink)] hover:border-[var(--lagoon)] hover:bg-[rgba(79,184,178,0.06)]",
                  ].join(" ")}
                >
                  <span>{formatWeekRange(monday)}</span>
                  {isSelected && (
                    <span className="ml-2 h-1.5 w-1.5 rounded-full bg-[var(--lagoon)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Offset field */}
          <div className="mb-5 flex flex-col gap-1.5">
            <label
              className="text-sm font-medium text-[var(--sea-ink)]"
              htmlFor="copy-week-offset"
            >
              Shift all anchor times by
            </label>
            <Input
              id="copy-week-offset"
              type="number"
              value={offsetMinutes}
              onChange={(e) => setOffsetMinutes(Number(e.target.value))}
              placeholder="0"
              step={5}
            />
            <p className="text-xs text-[var(--sea-ink-soft)]">
              e.g. +30 to start 30 min later, -15 to start earlier
            </p>
          </div>

          {error && <p className="text-destructive mb-3 text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleCopy} disabled={loading || !selectedWeek}>
              {loading ? "Copying…" : "Copy"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
