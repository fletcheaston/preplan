import { useState } from "react";

import { AlertCircle, X } from "lucide-react";

export function SyncErrorBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-center gap-3 border-b border-[var(--rule)] bg-[var(--paper)] px-4 py-2.5">
      <AlertCircle className="size-4 shrink-0 text-[var(--terracotta)]" />
      <p className="flex-1 text-sm text-[var(--ink)]">
        Google Calendar sync needs attention.{" "}
        <a href="/auth/google" className="font-semibold underline">
          Reconnect Google
        </a>{" "}
        to resume syncing.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-[var(--ink-soft)] hover:text-[var(--ink)]"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
