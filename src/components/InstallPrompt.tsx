import { useEffect, useState } from "react";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 shadow-lg md:right-4 md:left-auto md:max-w-sm">
      <Download className="size-5 shrink-0 text-[var(--lagoon-deep)]" />
      <p className="flex-1 text-sm text-[var(--sea-ink)]">
        Install Preplan for quick access
      </p>
      <Button
        size="sm"
        onClick={async () => {
          await prompt.prompt();
          const { outcome } = await prompt.userChoice;
          if (outcome === "accepted") setPrompt(null);
          else setDismissed(true);
        }}
      >
        Install
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="text-xs text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
      >
        ✕
      </button>
    </div>
  );
}
