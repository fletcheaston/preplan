import { createServerFn } from "@tanstack/react-start";

import { and, asc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { getLocalDb } from "@/db/local";
import { chains, events } from "@/db/schema";
import type { Chain, Event } from "@/db/schema";
import { requireAuth } from "@/lib/requireAuth";
import { syncChainToCalendar, unsyncChain } from "@/lib/sync";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");
const hhmm = z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM");

export type ChainWithEvents = Chain & { events: Event[] };

// Get all chains for a specific day, with their events ordered by sort_order
export async function getChainsByDay(
  userId: string,
  day: string,
): Promise<ChainWithEvents[]> {
  const db = await getLocalDb();
  const rows = await db
    .select()
    .from(chains)
    .where(and(eq(chains.userId, userId), eq(chains.day, day)))
    .all();

  const result: ChainWithEvents[] = [];
  for (const chain of rows) {
    const chainEvents = await db
      .select()
      .from(events)
      .where(eq(events.chainId, chain.id))
      .orderBy(asc(events.sortOrder))
      .all();
    result.push({ ...chain, events: chainEvents });
  }

  return result;
}

// Get all chains for a week (7-day window starting from weekStart ISO date)
// Returns an object keyed by ISO date string
export async function getChainsByWeek(
  userId: string,
  weekStart: string,
): Promise<Record<string, ChainWithEvents[]>> {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const weekEnd = end.toISOString().slice(0, 10);

  const db = await getLocalDb();
  const rows = await db
    .select()
    .from(chains)
    .where(
      and(
        eq(chains.userId, userId),
        gte(chains.day, weekStart),
        lte(chains.day, weekEnd),
      ),
    )
    .all();

  // Build a map of chainId -> events
  const result: Record<string, ChainWithEvents[]> = {};

  // Initialize all 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dayStr = d.toISOString().slice(0, 10);
    result[dayStr] = [];
  }

  for (const chain of rows) {
    const chainEvents = await db
      .select()
      .from(events)
      .where(eq(events.chainId, chain.id))
      .orderBy(asc(events.sortOrder))
      .all();
    const chainWithEvents: ChainWithEvents = { ...chain, events: chainEvents };
    if (!result[chain.day]) {
      result[chain.day] = [];
    }
    result[chain.day].push(chainWithEvents);
  }

  return result;
}

// Create a new chain
export async function createChain(
  userId: string,
  data: {
    day: string;
    name: string;
    anchorTime: string;
    direction: "forward" | "backward";
  },
): Promise<Chain> {
  const db = await getLocalDb();
  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(chains).values({
    id,
    userId,
    day: data.day,
    name: data.name,
    anchorTime: data.anchorTime,
    direction: data.direction,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.select().from(chains).where(eq(chains.id, id)).get();
  if (!created) throw new Error("Failed to create chain");
  return created;
}

// Update a chain (partial update, validates ownership)
export async function updateChain(
  chainId: string,
  userId: string,
  data: Partial<{
    name: string;
    anchorTime: string;
    direction: "forward" | "backward";
  }>,
): Promise<Chain> {
  const db = await getLocalDb();
  const existing = await db
    .select()
    .from(chains)
    .where(eq(chains.id, chainId))
    .get();
  if (!existing) throw new Error(`Chain not found: ${chainId}`);
  if (existing.userId !== userId)
    throw new Error(`Not authorized to update chain: ${chainId}`);

  await db
    .update(chains)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(chains.id, chainId), eq(chains.userId, userId)));

  const updated = await db
    .select()
    .from(chains)
    .where(eq(chains.id, chainId))
    .get();
  if (!updated) throw new Error(`Chain not found after update: ${chainId}`);
  return updated;
}

// Delete a chain (cascades to events via FK)
export async function deleteChain(
  chainId: string,
  userId: string,
): Promise<void> {
  const db = await getLocalDb();
  const existing = await db
    .select()
    .from(chains)
    .where(eq(chains.id, chainId))
    .get();
  if (!existing) throw new Error(`Chain not found: ${chainId}`);
  if (existing.userId !== userId)
    throw new Error(`Not authorized to delete chain: ${chainId}`);

  await db
    .delete(chains)
    .where(and(eq(chains.id, chainId), eq(chains.userId, userId)));
}

// --- Server function wrappers ---

export const $getChainsByDay = createServerFn({ method: "GET" })
  .inputValidator(z.object({ day: isoDate }))
  .handler(async ({ data }) => {
    const user = await requireAuth();
    return getChainsByDay(user.id, data.day);
  });

export const $getChainsByWeek = createServerFn({ method: "GET" })
  .inputValidator(z.object({ weekStart: isoDate }))
  .handler(async ({ data }) => {
    const user = await requireAuth();
    return getChainsByWeek(user.id, data.weekStart);
  });

export const $createChain = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      day: isoDate,
      name: z.string().min(1).max(100),
      anchorTime: hhmm,
      direction: z.enum(["forward", "backward"]),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getLocalDb();
    const user = await requireAuth();
    const newChain = await createChain(user.id, data);
    try {
      await syncChainToCalendar(db, user.id, newChain.id);
    } catch (err) {
      console.error("[sync] post-createChain sync failed:", err);
    }
    return newChain;
  });

export const $updateChain = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      chainId: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      anchorTime: hhmm.optional(),
      direction: z.enum(["forward", "backward"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getLocalDb();
    const user = await requireAuth();
    const { chainId, ...rest } = data;
    const updated = await updateChain(chainId, user.id, rest);
    try {
      await syncChainToCalendar(db, user.id, chainId);
    } catch (err) {
      console.error("[sync] post-updateChain sync failed:", err);
    }
    return updated;
  });

export const $deleteChain = createServerFn({ method: "POST" })
  .inputValidator(z.object({ chainId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const db = await getLocalDb();
    const user = await requireAuth();
    try {
      await unsyncChain(db, user.id, data.chainId);
    } catch (err) {
      console.error("[sync] pre-deleteChain unsync failed:", err);
    }
    return deleteChain(data.chainId, user.id);
  });

export const $copyDay = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sourceDay: isoDate,
      targetDay: isoDate,
      offsetMinutes: z.number().int().min(-720).max(720).optional(),
      clearExisting: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getLocalDb();
    const user = await requireAuth();

    if (data.clearExisting) {
      const existing = await getChainsByDay(user.id, data.targetDay);
      for (const chain of existing) {
        await db
          .delete(chains)
          .where(and(eq(chains.id, chain.id), eq(chains.userId, user.id)));
      }
    }

    const sourceChains = await getChainsByDay(user.id, data.sourceDay);

    const created: ChainWithEvents[] = [];
    for (const source of sourceChains) {
      let anchorTime = source.anchorTime;
      if (data.offsetMinutes) {
        const [h, m] = anchorTime.split(":").map(Number);
        const total =
          (((h * 60 + m + data.offsetMinutes) % 1440) + 1440) % 1440;
        anchorTime = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
      }

      const chainId = crypto.randomUUID();
      const now = new Date();
      await db.insert(chains).values({
        id: chainId,
        userId: user.id,
        day: data.targetDay,
        name: source.name,
        anchorTime,
        direction: source.direction,
        createdAt: now,
        updatedAt: now,
      });

      const newEvents: Event[] = [];
      for (const event of source.events) {
        const eventId = crypto.randomUUID();
        await db.insert(events).values({
          id: eventId,
          chainId,
          name: event.name,
          durationMinutes: event.durationMinutes,
          timezone: event.timezone,
          sortOrder: event.sortOrder,
          gcalEventId: null,
          createdAt: now,
          updatedAt: now,
        });
        newEvents.push({
          id: eventId,
          chainId,
          name: event.name,
          durationMinutes: event.durationMinutes,
          timezone: event.timezone,
          sortOrder: event.sortOrder,
          gcalEventId: null,
          createdAt: now,
          updatedAt: now,
        });
      }

      const newChain = await db
        .select()
        .from(chains)
        .where(eq(chains.id, chainId))
        .get();
      if (newChain) created.push({ ...newChain, events: newEvents });
    }

    return created;
  });

export const $triggerManualSync = createServerFn({ method: "POST" })
  .inputValidator(z.object({ chainId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const db = await getLocalDb();
    const user = await requireAuth();
    await syncChainToCalendar(db, user.id, data.chainId);
  });
