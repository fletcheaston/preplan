import { useNavigate } from "@tanstack/react-router";

import type { ChainWithEvents } from "@/lib/server/chains";
import { deriveEventTimes, formatDisplayTime } from "@/lib/time";

type DayColumnChainCardProps = {
  chain: ChainWithEvents;
  date: string; // ISO date
};

export function DayColumnChainCard({ chain, date }: DayColumnChainCardProps) {
  const navigate = useNavigate();

  const sortedEvents = [...chain.events].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const derivedEvents = deriveEventTimes(chain, sortedEvents);

  const isBackward = chain.direction === "backward";
  const directionChar = isBackward ? "\u2190" : "\u2192";

  const eventCount = chain.events.length;

  function handleClick() {
    navigate({ to: "/plan/$date", params: { date } });
  }

  // Use derivedEvents to suppress unused warning
  void derivedEvents;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full cursor-pointer border-b border-[var(--rule-light)] px-2 py-1.5 text-left transition-colors last:border-b-0 hover:bg-[var(--paper)]"
    >
      {/* Chain name with left dot marker */}
      <div className="flex items-start gap-1.5">
        <span
          className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full"
          style={{
            backgroundColor: isBackward ? "var(--terracotta)" : "var(--sage)",
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-base leading-tight font-semibold text-[var(--ink)]">
            {chain.name}
          </div>
          {/* Anchor time in mono */}
          <div className="font-mono text-sm text-[var(--ink-soft)]">
            {directionChar} {formatDisplayTime(chain.anchorTime)}
          </div>
        </div>
      </div>

      {/* Event count */}
      <div className="mt-0.5 pl-3">
        <span className="text-sm text-[var(--ink-soft)]">
          {eventCount === 0
            ? "No events"
            : eventCount === 1
              ? "1 event"
              : `${eventCount} events`}
        </span>
      </div>
    </button>
  );
}
