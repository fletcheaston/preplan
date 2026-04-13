import { Link } from "@tanstack/react-router";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PlanErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="text-destructive size-10" />
      <div>
        <p className="font-semibold text-[var(--sea-ink)]">
          Something went wrong
        </p>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          {error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
        <Button asChild>
          <Link to="/plan">Go to today</Link>
        </Button>
      </div>
    </div>
  );
}
