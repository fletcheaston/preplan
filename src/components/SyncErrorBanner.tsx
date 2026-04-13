import { useState } from "react";

import { AlertCircle, X } from "lucide-react";

export function SyncErrorBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-center gap-3 border-b border-[var(--line)] bg-amber-50 px-4 py-2.5 dark:bg-amber-950/30">
      <AlertCircle className="size-4 shrink-0 text-amber-600" />
      <p className="flex-1 text-sm text-amber-800 dark:text-amber-200">
        Google Calendar sync needs attention.{" "}
        <a href="/auth/google" className="font-semibold underline">
          Reconnect Google
        </a>{" "}
        to resume syncing.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-600 hover:text-amber-800"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
