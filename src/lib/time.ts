import type { Chain, Event } from "@/db/schema";

export type DerivedEvent = {
  eventId: string;
  name: string;
  durationMinutes: number;
  startTime: string; // "HH:MM" 24h
  endTime: string; // "HH:MM" 24h
  startDay: string; // ISO date "YYYY-MM-DD" (may differ from chain.day for cross-midnight events)
  endDay: string; // ISO date "YYYY-MM-DD"
};

export type DerivedChain = {
  chain: Chain;
  events: DerivedEvent[];
};

/** Parse "HH:MM" to total minutes since midnight (0–1439). */
export function parseTime(hhmm: string): number {
  const [hourStr, minuteStr] = hhmm.split(":");
  const hours = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);
  return hours * 60 + minutes;
}

/** Convert total minutes (can be negative or > 1440) to "HH:MM". */
export function formatTime(totalMinutes: number): string {
  const normalised = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalised / 60);
  const minutes = normalised % 60;
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Add `days` (can be negative) to an ISO date string "YYYY-MM-DD", return new ISO date string. */
export function addDays(isoDate: string, days: number): string {
  // Use T12:00:00Z to avoid DST issues
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Given a minuteOffset from midnight of chain.day (can be negative for previous day,
 * or >= 1440 for next day), return the ISO date string.
 */
function resolveDay(chainDay: string, minuteOffset: number): string {
  const dayOffset = Math.floor(minuteOffset / 1440);
  return addDays(chainDay, dayOffset);
}

/**
 * Derive start/end times for each event in a chain.
 * Events must be pre-sorted by sortOrder ascending.
 * Returns events in the same order as input.
 */
export function deriveEventTimes(
  chain: Chain,
  events: Event[],
): DerivedEvent[] {
  if (events.length === 0) return [];

  const anchorMinutes = parseTime(chain.anchorTime);

  if (chain.direction === "forward") {
    const result: DerivedEvent[] = [];
    // anchorMinutes is the absolute minute offset from midnight of chain.day for the start of event[0]
    let cursor = anchorMinutes;

    for (const event of events) {
      const startOffset = cursor;
      const endOffset = cursor + event.durationMinutes;

      const startDay = resolveDay(chain.day, startOffset);
      const endDay = resolveDay(chain.day, endOffset);

      result.push({
        eventId: event.id,
        name: event.name,
        durationMinutes: event.durationMinutes,
        startTime: formatTime(startOffset),
        endTime: formatTime(endOffset),
        startDay,
        endDay,
      });

      cursor = endOffset;
    }

    return result;
  } else {
    // backward: anchor is the end of the last event
    // Work backwards through the array to compute offsets
    const offsets: { startOffset: number; endOffset: number }[] = new Array(
      events.length,
    );

    let cursor = anchorMinutes;
    for (let i = events.length - 1; i >= 0; i--) {
      const endOffset = cursor;
      const startOffset = cursor - events[i].durationMinutes;

      offsets[i] = { startOffset, endOffset };
      cursor = startOffset;
    }

    return events.map((event, i) => {
      const { startOffset, endOffset } = offsets[i];
      const startDay = resolveDay(chain.day, startOffset);
      const endDay = resolveDay(chain.day, endOffset);

      return {
        eventId: event.id,
        name: event.name,
        durationMinutes: event.durationMinutes,
        startTime: formatTime(startOffset),
        endTime: formatTime(endOffset),
        startDay,
        endDay,
      };
    });
  }
}

/** Human-readable duration display. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  } else {
    const hourPart = hours === 1 ? "1 hour" : `${hours} hours`;
    return `${hourPart} ${mins} min`;
  }
}

/** Convert 24h "HH:MM" to 12h display string. */
export function formatDisplayTime(hhmm: string): string {
  const totalMinutes = parseTime(hhmm);
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const period = hours24 < 12 ? "AM" : "PM";
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;

  const mm = String(minutes).padStart(2, "0");
  return `${hours12}:${mm} ${period}`;
}

/** Given a Monday ISO date, return array of 7 ISO dates [Mon..Sun]. */
export function getWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/** Returns true if minutes is a multiple of 15 and between 15 and 720 inclusive. */
export function validateDuration(minutes: number): boolean {
  return minutes >= 15 && minutes <= 720 && minutes % 15 === 0;
}

/** Returns all valid duration options (15 to 720 in steps of 15). */
export function getDurationOptions(): { value: number; label: string }[] {
  const options: { value: number; label: string }[] = [];
  for (let v = 15; v <= 720; v += 15) {
    options.push({ value: v, label: formatDuration(v) });
  }
  return options;
}
