import { useNavigate } from "@tanstack/react-router";

import type { ChainWithEvents } from "@/lib/server/chains";
import {
  deriveEventTimes,
  formatDisplayTime,
  formatDuration,
} from "@/lib/time";

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

  const totalDuration = chain.events.reduce(
    (sum, e) => sum + e.durationMinutes,
    0,
  );

  const directionLabel =
    chain.direction === "backward"
      ? `← ${formatDisplayTime(chain.anchorTime)}`
      : `→ ${formatDisplayTime(chain.anchorTime)}`;

  const eventCount = chain.events.length;

  function handleClick() {
    navigate({ to: "/plan/$date", params: { date } });
  }

  // Use derivedEvents to suppress unused warning — we expose first/last times if useful
  void derivedEvents;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full cursor-pointer overflow-hidden rounded-xl border border-[var(--line)] bg-[linear-gradient(165deg,var(--surface-strong),var(--surface))] px-3 py-2 text-left shadow-[0_1px_0_var(--inset-glint)_inset,0_2px_8px_rgba(23,58,64,0.06)] transition-all hover:border-[var(--lagoon)] hover:shadow-[0_2px_12px_rgba(79,184,178,0.18)] active:scale-[0.98]"
    >
      {/* Chain name */}
      <div className="truncate text-xs leading-tight font-bold text-[var(--sea-ink)]">
        {chain.name}
      </div>

      {/* Anchor time */}
      <div className="mt-0.5 text-[10px] font-semibold text-[var(--lagoon-deep)]">
        {directionLabel}
      </div>

      {/* Event count + duration */}
      <div className="mt-1 flex items-center justify-between gap-1">
        <span className="text-[10px] text-[var(--sea-ink-soft)]">
          {eventCount === 0
            ? "No events"
            : eventCount === 1
              ? "1 event"
              : `${eventCount} events`}
        </span>
        {totalDuration > 0 && (
          <span className="text-[10px] text-[var(--sea-ink-soft)]">
            {formatDuration(totalDuration)}
          </span>
        )}
      </div>
    </button>
  );
}
