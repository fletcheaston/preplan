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
import type { Chain } from "@/db/schema";
import { $updateChain } from "@/lib/server/chains";

type EditChainDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chain: Chain;
  onSuccess: () => void;
};

export function EditChainDialog({
  open,
  onOpenChange,
  chain,
  onSuccess,
}: EditChainDialogProps) {
  const [name, setName] = useState(chain.name);
  const [anchorTime, setAnchorTime] = useState(chain.anchorTime);
  const [direction, setDirection] = useState<"forward" | "backward">(
    chain.direction,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset fields when chain changes
  useEffect(() => {
    setName(chain.name);
    setAnchorTime(chain.anchorTime);
    setDirection(chain.direction);
    setError(null);
  }, [chain.id, chain.name, chain.anchorTime, chain.direction]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !anchorTime) return;
    setLoading(true);
    setError(null);
    try {
      await $updateChain({
        data: { chainId: chain.id, name: name.trim(), anchorTime, direction },
      });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update chain");
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
            Edit Chain
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mb-4 text-sm text-[var(--sea-ink-soft)]">
            Update this chain's name, anchor time, or direction.
          </DialogPrimitive.Description>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-medium text-[var(--sea-ink)]"
                htmlFor="edit-chain-name"
              >
                Name
              </label>
              <Input
                id="edit-chain-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-medium text-[var(--sea-ink)]"
                htmlFor="edit-chain-anchor-time"
              >
                Anchor time
              </label>
              <input
                id="edit-chain-anchor-time"
                type="time"
                value={anchorTime}
                onChange={(e) => setAnchorTime(e.target.value)}
                required
                className="h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm text-[var(--sea-ink)] shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-[var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--sea-ink)]">
                Direction
              </label>
              <Select
                value={direction}
                onValueChange={(v) => setDirection(v as "forward" | "backward")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backward">Backward from time</SelectItem>
                  <SelectItem value="forward">Forward from time</SelectItem>
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
              <Button
                type="submit"
                disabled={loading || !name.trim() || !anchorTime}
              >
                {loading ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
