import { useEffect, useState } from "react";

import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Event } from "@/db/schema";
import { $updateEvent } from "@/lib/server/events";
import { getDurationOptions } from "@/lib/time";

type EditEventDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onSuccess: () => void;
};

const durationOptions = getDurationOptions();

export function EditEventDialog({
  open,
  onOpenChange,
  event,
  onSuccess,
}: EditEventDialogProps) {
  const [name, setName] = useState(event.name);
  const [durationMinutes, setDurationMinutes] = useState(event.durationMinutes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset fields when event changes
  useEffect(() => {
    setName(event.name);
    setDurationMinutes(event.durationMinutes);
    setError(null);
  }, [event.id, event.name, event.durationMinutes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await $updateEvent({
        data: { eventId: event.id, name: name.trim(), durationMinutes },
      });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-xl">
          <DialogPrimitive.Title className="mb-1 text-base font-semibold text-[var(--sea-ink)]">
            Edit Event
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mb-4 text-sm text-[var(--sea-ink-soft)]">
            Update this event's name or duration.
          </DialogPrimitive.Description>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-medium text-[var(--sea-ink)]"
                htmlFor="edit-event-name"
              >
                Name
              </label>
              <Input
                id="edit-event-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--sea-ink)]">
                Duration
              </label>
              <Select
                value={String(durationMinutes)}
                onValueChange={(v) => setDurationMinutes(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
