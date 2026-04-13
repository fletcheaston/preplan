import { describe, expect, it } from "vitest";

import type { Chain, Event } from "@/db/schema";
import {
  deriveEventTimes,
  formatDisplayTime,
  formatDuration,
  formatTime,
  getDurationOptions,
  parseTime,
  validateDuration,
} from "@/lib/time";

// ---------------------------------------------------------------------------
// Helpers for building minimal Chain / Event objects
// ---------------------------------------------------------------------------

function makeChain(overrides: Partial<Chain> = {}): Chain {
  return {
    id: "chain-1",
    userId: "user-1",
    day: "2024-01-10",
    name: "Test Chain",
    anchorTime: "09:00",
    direction: "backward",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeEvent(
  id: string,
  name: string,
  durationMinutes: number,
  sortOrder: number,
  chainId = "chain-1",
): Event {
  return {
    id,
    chainId,
    name,
    durationMinutes,
    sortOrder,
    gcalEventId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// parseTime
// ---------------------------------------------------------------------------

describe("parseTime", () => {
  it('parses "00:00" to 0', () => {
    expect(parseTime("00:00")).toBe(0);
  });

  it('parses "09:00" to 540', () => {
    expect(parseTime("09:00")).toBe(540);
  });

  it('parses "23:59" to 1439', () => {
    expect(parseTime("23:59")).toBe(1439);
  });
});

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------

describe("formatTime", () => {
  it("formats 0 as 00:00", () => {
    expect(formatTime(0)).toBe("00:00");
  });

  it("formats 540 as 09:00", () => {
    expect(formatTime(540)).toBe("09:00");
  });

  it("formats 1439 as 23:59", () => {
    expect(formatTime(1439)).toBe("23:59");
  });

  it("wraps 1440 to 00:00", () => {
    expect(formatTime(1440)).toBe("00:00");
  });

  it("wraps 1441 to 00:01", () => {
    expect(formatTime(1441)).toBe("00:01");
  });

  it("wraps -60 to 23:00", () => {
    expect(formatTime(-60)).toBe("23:00");
  });
});

// ---------------------------------------------------------------------------
// deriveEventTimes — backward chain
// ---------------------------------------------------------------------------

describe("deriveEventTimes — backward chain", () => {
  it("standard case: anchor 09:00, 3 events, all same day", () => {
    const chain = makeChain({
      day: "2024-01-10",
      anchorTime: "09:00",
      direction: "backward",
    });
    // sortOrder ascending: shower(1) → workout(2) → wakeup(3)
    const events = [
      makeEvent("e1", "shower", 45, 1),
      makeEvent("e2", "workout", 60, 2),
      makeEvent("e3", "wakeup", 15, 3),
    ];

    const derived = deriveEventTimes(chain, events);

    expect(derived).toHaveLength(3);

    // wakeup (last): ends 09:00, starts 08:45
    expect(derived[2].name).toBe("wakeup");
    expect(derived[2].startTime).toBe("08:45");
    expect(derived[2].endTime).toBe("09:00");
    expect(derived[2].startDay).toBe("2024-01-10");
    expect(derived[2].endDay).toBe("2024-01-10");

    // workout (middle): ends 08:45, starts 07:45
    expect(derived[1].name).toBe("workout");
    expect(derived[1].startTime).toBe("07:45");
    expect(derived[1].endTime).toBe("08:45");
    expect(derived[1].startDay).toBe("2024-01-10");
    expect(derived[1].endDay).toBe("2024-01-10");

    // shower (first): ends 07:45, starts 07:00
    expect(derived[0].name).toBe("shower");
    expect(derived[0].startTime).toBe("07:00");
    expect(derived[0].endTime).toBe("07:45");
    expect(derived[0].startDay).toBe("2024-01-10");
    expect(derived[0].endDay).toBe("2024-01-10");
  });

  it("cross-midnight: anchor 01:00, one 120min event → starts previous day", () => {
    const chain = makeChain({
      day: "2024-01-10",
      anchorTime: "01:00",
      direction: "backward",
    });
    const events = [makeEvent("e1", "Event A", 120, 1)];

    const derived = deriveEventTimes(chain, events);

    expect(derived).toHaveLength(1);
    expect(derived[0].endTime).toBe("01:00");
    expect(derived[0].endDay).toBe("2024-01-10");
    expect(derived[0].startTime).toBe("23:00");
    expect(derived[0].startDay).toBe("2024-01-09");
  });

  it("single event: anchor 10:00, 30min → starts 09:30", () => {
    const chain = makeChain({
      day: "2024-01-10",
      anchorTime: "10:00",
      direction: "backward",
    });
    const events = [makeEvent("e1", "prep", 30, 1)];

    const derived = deriveEventTimes(chain, events);

    expect(derived).toHaveLength(1);
    expect(derived[0].startTime).toBe("09:30");
    expect(derived[0].endTime).toBe("10:00");
    expect(derived[0].startDay).toBe("2024-01-10");
    expect(derived[0].endDay).toBe("2024-01-10");
  });

  it("empty events array returns []", () => {
    const chain = makeChain();
    expect(deriveEventTimes(chain, [])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// deriveEventTimes — forward chain
// ---------------------------------------------------------------------------

describe("deriveEventTimes — forward chain", () => {
  it("standard case: anchor 09:00, 3 events cascade forward", () => {
    const chain = makeChain({
      day: "2024-01-10",
      anchorTime: "09:00",
      direction: "forward",
    });
    const events = [
      makeEvent("e1", "breakfast", 30, 1),
      makeEvent("e2", "commute", 45, 2),
      makeEvent("e3", "work", 60, 3),
    ];

    const derived = deriveEventTimes(chain, events);

    expect(derived).toHaveLength(3);

    // breakfast: starts 09:00, ends 09:30
    expect(derived[0].name).toBe("breakfast");
    expect(derived[0].startTime).toBe("09:00");
    expect(derived[0].endTime).toBe("09:30");
    expect(derived[0].startDay).toBe("2024-01-10");
    expect(derived[0].endDay).toBe("2024-01-10");

    // commute: starts 09:30, ends 10:15
    expect(derived[1].name).toBe("commute");
    expect(derived[1].startTime).toBe("09:30");
    expect(derived[1].endTime).toBe("10:15");
    expect(derived[1].startDay).toBe("2024-01-10");
    expect(derived[1].endDay).toBe("2024-01-10");

    // work: starts 10:15, ends 11:15
    expect(derived[2].name).toBe("work");
    expect(derived[2].startTime).toBe("10:15");
    expect(derived[2].endTime).toBe("11:15");
    expect(derived[2].startDay).toBe("2024-01-10");
    expect(derived[2].endDay).toBe("2024-01-10");
  });

  it("cross-midnight: anchor 23:00, one 120min event → ends next day", () => {
    const chain = makeChain({
      day: "2024-01-10",
      anchorTime: "23:00",
      direction: "forward",
    });
    const events = [makeEvent("e1", "late work", 120, 1)];

    const derived = deriveEventTimes(chain, events);

    expect(derived).toHaveLength(1);
    expect(derived[0].startTime).toBe("23:00");
    expect(derived[0].startDay).toBe("2024-01-10");
    expect(derived[0].endTime).toBe("01:00");
    expect(derived[0].endDay).toBe("2024-01-11");
  });

  it("single event: anchor 09:00, 60min → ends 10:00", () => {
    const chain = makeChain({
      day: "2024-01-10",
      anchorTime: "09:00",
      direction: "forward",
    });
    const events = [makeEvent("e1", "meeting", 60, 1)];

    const derived = deriveEventTimes(chain, events);

    expect(derived).toHaveLength(1);
    expect(derived[0].startTime).toBe("09:00");
    expect(derived[0].endTime).toBe("10:00");
    expect(derived[0].startDay).toBe("2024-01-10");
    expect(derived[0].endDay).toBe("2024-01-10");
  });
});

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

describe("formatDuration", () => {
  it('formats 15 as "15 min"', () => {
    expect(formatDuration(15)).toBe("15 min");
  });

  it('formats 45 as "45 min"', () => {
    expect(formatDuration(45)).toBe("45 min");
  });

  it('formats 60 as "1 hour"', () => {
    expect(formatDuration(60)).toBe("1 hour");
  });

  it('formats 90 as "1 hour 30 min"', () => {
    expect(formatDuration(90)).toBe("1 hour 30 min");
  });

  it('formats 120 as "2 hours"', () => {
    expect(formatDuration(120)).toBe("2 hours");
  });

  it('formats 150 as "2 hours 30 min"', () => {
    expect(formatDuration(150)).toBe("2 hours 30 min");
  });

  it('formats 480 as "8 hours"', () => {
    expect(formatDuration(480)).toBe("8 hours");
  });
});

// ---------------------------------------------------------------------------
// formatDisplayTime
// ---------------------------------------------------------------------------

describe("formatDisplayTime", () => {
  it('formats "09:00" as "9:00 AM"', () => {
    expect(formatDisplayTime("09:00")).toBe("9:00 AM");
  });

  it('formats "13:30" as "1:30 PM"', () => {
    expect(formatDisplayTime("13:30")).toBe("1:30 PM");
  });

  it('formats "00:00" as "12:00 AM"', () => {
    expect(formatDisplayTime("00:00")).toBe("12:00 AM");
  });

  it('formats "12:00" as "12:00 PM"', () => {
    expect(formatDisplayTime("12:00")).toBe("12:00 PM");
  });
});

// ---------------------------------------------------------------------------
// validateDuration
// ---------------------------------------------------------------------------

describe("validateDuration", () => {
  it("returns true for 15", () => {
    expect(validateDuration(15)).toBe(true);
  });

  it("returns true for 30", () => {
    expect(validateDuration(30)).toBe(true);
  });

  it("returns true for 720", () => {
    expect(validateDuration(720)).toBe(true);
  });

  it("returns false for 14 (not multiple of 15)", () => {
    expect(validateDuration(14)).toBe(false);
  });

  it("returns false for 0", () => {
    expect(validateDuration(0)).toBe(false);
  });

  it("returns false for 735 (exceeds max)", () => {
    expect(validateDuration(735)).toBe(false);
  });

  it("returns false for 7", () => {
    expect(validateDuration(7)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getDurationOptions
// ---------------------------------------------------------------------------

describe("getDurationOptions", () => {
  it("returns 48 options", () => {
    expect(getDurationOptions()).toHaveLength(48);
  });

  it('first option is { value: 15, label: "15 min" }', () => {
    const options = getDurationOptions();
    expect(options[0]).toEqual({ value: 15, label: "15 min" });
  });

  it('last option is { value: 720, label: "12 hours" }', () => {
    const options = getDurationOptions();
    expect(options[options.length - 1]).toEqual({
      value: 720,
      label: "12 hours",
    });
  });
});
