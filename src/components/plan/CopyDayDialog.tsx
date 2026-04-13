import { useState } from "react";

import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { $copyDay } from "@/lib/server/chains";

type CopyDayDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetDay: string;
  onSuccess: () => void;
};

function addDaysUTC(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function getPast14Days(targetDay: string): string[] {
  const days: string[] = [];
  for (let i = 1; i <= 14; i++) {
    days.push(addDaysUTC(targetDay, -i));
  }
  return days;
}

export function CopyDayDialog({
  open,
  onOpenChange,
  targetDay,
  onSuccess,
}: CopyDayDialogProps) {
  const pastDays = getPast14Days(targetDay);
  const [selectedDay, setSelectedDay] = useState<string>(pastDays[0]);
  const [offsetMinutes, setOffsetMinutes] = useState<number>(0);
  const [clearExisting, setClearExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    setLoading(true);
    setError(null);
    try {
      await $copyDay({
        data: {
          sourceDay: selectedDay,
          targetDay,
          offsetMinutes: offsetMinutes || undefined,
          clearExisting: clearExisting || undefined,
        },
      });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to copy day");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40" />
        <DialogPrimitive.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--rule)] bg-[var(--white)] p-6 shadow-lg">
          <DialogPrimitive.Title className="mb-1 text-base font-semibold text-[var(--ink)]">
            Copy from a past day
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mb-4 text-sm text-[var(--ink-soft)]">
            Choose a day to copy all its chains into {formatDayLabel(targetDay)}
            .
          </DialogPrimitive.Description>

          {/* Day list */}
          <div className="mb-4 flex max-h-60 flex-col gap-1.5 overflow-y-auto pr-0.5">
            {pastDays.map((day) => {
              const isSelected = day === selectedDay;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={[
                    "flex cursor-pointer items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition-all",
                    isSelected
                      ? "border-[var(--terracotta)] bg-[var(--selection)] font-semibold text-[var(--terracotta)]"
                      : "border-[var(--rule)] bg-[var(--white)] text-[var(--ink)] hover:border-[var(--terracotta)] hover:bg-[var(--paper)]",
                  ].join(" ")}
                >
                  <span>{formatDayLabel(day)}</span>
                  {isSelected && (
                    <span className="ml-2 h-1.5 w-1.5 rounded-full bg-[var(--terracotta)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Offset field */}
          <div className="mb-5 flex flex-col gap-1.5">
            <label
              className="text-sm font-medium text-[var(--ink)]"
              htmlFor="copy-day-offset"
            >
              Shift all anchor times by
            </label>
            <Input
              id="copy-day-offset"
              type="number"
              value={offsetMinutes}
              onChange={(e) => setOffsetMinutes(Number(e.target.value))}
              placeholder="0"
              step={5}
            />
            <p className="text-xs text-[var(--ink-soft)]">
              e.g. +30 to start 30 min later, -15 to start earlier
            </p>
          </div>

          {/* Clear existing toggle */}
          <label className="mb-5 flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              className="size-4 accent-[var(--terracotta)]"
            />
            <span className="text-sm text-[var(--ink)]">
              Remove existing chains from this day first
            </span>
          </label>

          {error && (
            <p className="mb-3 text-sm text-[var(--terracotta)]">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleCopy} disabled={loading || !selectedDay}>
              {loading ? "Copying..." : "Copy"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
