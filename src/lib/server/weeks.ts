import { createServerFn } from "@tanstack/react-start";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getLocalDb } from "@/db/local";
import { chains, events } from "@/db/schema";
import { requireAuth } from "@/lib/requireAuth";
import { type ChainWithEvents, getChainsByWeek } from "@/lib/server/chains";

// Apply an offset in minutes to a HH:MM time string, handling midnight rollover
function applyMinuteOffset(time: string, offsetMinutes: number): string {
  const [hourStr, minStr] = time.split(":");
  const totalMinutes =
    parseInt(hourStr, 10) * 60 + parseInt(minStr, 10) + offsetMinutes;
  // Handle rollover in both directions
  const normalised = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalised / 60);
  const m = normalised % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Copy all chains+events from a source week to a target week
// sourceWeekStart and targetWeekStart are ISO date strings (Monday of week)
// offsetMinutes: optional global shift applied to all anchor times (can be negative)
// Returns the newly created chains
export async function copyWeek(
  userId: string,
  sourceWeekStart: string,
  targetWeekStart: string,
  offsetMinutes?: number,
): Promise<ChainWithEvents[]> {
  const db = await getLocalDb();
  const sourceWeek = await getChainsByWeek(userId, sourceWeekStart);

  const created: ChainWithEvents[] = [];

  for (const [day, dayChains] of Object.entries(sourceWeek)) {
    if (dayChains.length === 0) continue;

    // Calculate day-of-week offset from source week start
    const sourceDay = new Date(day);
    const sourceStart = new Date(sourceWeekStart);
    const dayOffset = Math.round(
      (sourceDay.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Calculate the corresponding target day
    const targetDay = new Date(targetWeekStart);
    targetDay.setDate(targetDay.getDate() + dayOffset);
    const targetDayStr = targetDay.toISOString().slice(0, 10);

    for (const chain of dayChains) {
      const newChainId = crypto.randomUUID();
      const now = new Date();

      const newAnchorTime =
        offsetMinutes !== undefined
          ? applyMinuteOffset(chain.anchorTime, offsetMinutes)
          : chain.anchorTime;

      await db.insert(chains).values({
        id: newChainId,
        userId,
        day: targetDayStr,
        name: chain.name,
        anchorTime: newAnchorTime,
        direction: chain.direction,
        createdAt: now,
        updatedAt: now,
      });

      const newEvents = [];
      for (const event of chain.events) {
        const newEventId = crypto.randomUUID();
        await db.insert(events).values({
          id: newEventId,
          chainId: newChainId,
          name: event.name,
          durationMinutes: event.durationMinutes,
          timezone: event.timezone,
          sortOrder: event.sortOrder,
          gcalEventId: null,
          createdAt: now,
          updatedAt: now,
        });
        newEvents.push({
          id: newEventId,
          chainId: newChainId,
          name: event.name,
          durationMinutes: event.durationMinutes,
          timezone: event.timezone,
          sortOrder: event.sortOrder,
          gcalEventId: null,
          createdAt: now,
          updatedAt: now,
        });
      }

      created.push({
        id: newChainId,
        userId,
        day: targetDayStr,
        name: chain.name,
        anchorTime: newAnchorTime,
        direction: chain.direction,
        createdAt: now,
        updatedAt: now,
        events: newEvents,
      });
    }
  }

  return created;
}

// --- Server function wrapper ---

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");

export const $copyWeek = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sourceWeekStart: isoDate,
      targetWeekStart: isoDate,
      offsetMinutes: z.number().int().min(-720).max(720).optional(),
      clearExisting: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireAuth();

    if (data.clearExisting) {
      const db = await getLocalDb();
      const existing = await getChainsByWeek(user.id, data.targetWeekStart);
      for (const dayChains of Object.values(existing)) {
        for (const chain of dayChains) {
          await db
            .delete(chains)
            .where(and(eq(chains.id, chain.id), eq(chains.userId, user.id)));
        }
      }
    }

    return copyWeek(
      user.id,
      data.sourceWeekStart,
      data.targetWeekStart,
      data.offsetMinutes,
    );
  });
