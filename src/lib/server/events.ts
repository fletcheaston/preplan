import { createServerFn } from "@tanstack/react-start";

import { and, eq, max } from "drizzle-orm";
import { z } from "zod";

import { getLocalDb } from "@/db/local";
import { chains, events } from "@/db/schema";
import type { Event } from "@/db/schema";
import { requireAuth } from "@/lib/requireAuth";
import { syncChainToCalendar } from "@/lib/sync";

// Create an event in a chain (validates chain ownership via userId)
// Appends to end: new sort_order = max(existing sort_orders) + 1000
// Validates: durationMinutes is multiple of 15, between 15 and 720
export async function createEvent(
  chainId: string,
  userId: string,
  data: { name: string; durationMinutes: number },
): Promise<Event> {
  if (data.durationMinutes % 15 !== 0) {
    throw new Error("durationMinutes must be a multiple of 15");
  }
  if (data.durationMinutes < 15 || data.durationMinutes > 720) {
    throw new Error("durationMinutes must be between 15 and 720");
  }

  const db = await getLocalDb();
  // Validate chain ownership
  const chain = await db
    .select()
    .from(chains)
    .where(eq(chains.id, chainId))
    .get();
  if (!chain) throw new Error(`Chain not found: ${chainId}`);
  if (chain.userId !== userId)
    throw new Error(`Not authorized to add events to chain: ${chainId}`);

  // Compute sort_order
  const maxResult = await db
    .select({ maxSortOrder: max(events.sortOrder) })
    .from(events)
    .where(eq(events.chainId, chainId))
    .get();
  const nextSortOrder = (maxResult?.maxSortOrder ?? 0) + 1000;

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(events).values({
    id,
    chainId,
    name: data.name,
    durationMinutes: data.durationMinutes,
    sortOrder: nextSortOrder,
    gcalEventId: null,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.select().from(events).where(eq(events.id, id)).get();
  if (!created) throw new Error("Failed to create event");
  return created;
}

// Update an event (validates chain ownership)
export async function updateEvent(
  eventId: string,
  userId: string,
  data: Partial<{ name: string; durationMinutes: number }>,
): Promise<Event> {
  if (data.durationMinutes !== undefined) {
    if (data.durationMinutes % 15 !== 0) {
      throw new Error("durationMinutes must be a multiple of 15");
    }
    if (data.durationMinutes < 15 || data.durationMinutes > 720) {
      throw new Error("durationMinutes must be between 15 and 720");
    }
  }

  const db = await getLocalDb();
  // Validate event + chain ownership
  const existing = await db
    .select({ event: events, chainUserId: chains.userId })
    .from(events)
    .innerJoin(chains, eq(events.chainId, chains.id))
    .where(eq(events.id, eventId))
    .get();

  if (!existing) throw new Error(`Event not found: ${eventId}`);
  if (existing.chainUserId !== userId)
    throw new Error(`Not authorized to update event: ${eventId}`);

  await db
    .update(events)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(events.id, eventId));

  const updated = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .get();
  if (!updated) throw new Error(`Event not found after update: ${eventId}`);
  return updated;
}

// Delete an event
export async function deleteEvent(
  eventId: string,
  userId: string,
): Promise<void> {
  const db = await getLocalDb();
  // Validate event + chain ownership
  const existing = await db
    .select({ event: events, chainUserId: chains.userId })
    .from(events)
    .innerJoin(chains, eq(events.chainId, chains.id))
    .where(eq(events.id, eventId))
    .get();

  if (!existing) throw new Error(`Event not found: ${eventId}`);
  if (existing.chainUserId !== userId)
    throw new Error(`Not authorized to delete event: ${eventId}`);

  await db.delete(events).where(eq(events.id, eventId));
}

// Reorder events within a chain — orderedEventIds is the full list in new order
// Assigns sort_order 1000, 2000, 3000... to each ID in order
// Validates all events belong to the chain and chain belongs to userId
export async function reorderEvents(
  chainId: string,
  userId: string,
  orderedEventIds: string[],
): Promise<void> {
  const db = await getLocalDb();
  // Validate chain ownership
  const chain = await db
    .select()
    .from(chains)
    .where(eq(chains.id, chainId))
    .get();
  if (!chain) throw new Error(`Chain not found: ${chainId}`);
  if (chain.userId !== userId)
    throw new Error(`Not authorized to reorder events in chain: ${chainId}`);

  // Validate all events belong to this chain
  const existingEvents = await db
    .select()
    .from(events)
    .where(eq(events.chainId, chainId))
    .all();

  const existingIds = new Set(existingEvents.map((e) => e.id));
  for (const id of orderedEventIds) {
    if (!existingIds.has(id)) {
      throw new Error(`Event ${id} does not belong to chain ${chainId}`);
    }
  }

  // Assign sort_order 1000, 2000, 3000...
  for (let i = 0; i < orderedEventIds.length; i++) {
    await db
      .update(events)
      .set({ sortOrder: (i + 1) * 1000, updatedAt: new Date() })
      .where(
        and(eq(events.id, orderedEventIds[i]), eq(events.chainId, chainId)),
      );
  }
}

// --- Server function wrappers ---

const durationMinutesSchema = z
  .number()
  .int()
  .min(15)
  .max(720)
  .refine((n) => n % 15 === 0, "Must be multiple of 15");

export const $createEvent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      chainId: z.string().uuid(),
      name: z.string().min(1).max(100),
      durationMinutes: durationMinutesSchema,
    }),
  )
  .handler(async ({ data }) => {
    const db = await getLocalDb();
    const user = await requireAuth();
    const created = await createEvent(data.chainId, user.id, {
      name: data.name,
      durationMinutes: data.durationMinutes,
    });
    try {
      await syncChainToCalendar(db, user.id, data.chainId);
    } catch (err) {
      console.error("[sync] post-createEvent sync failed:", err);
    }
    return created;
  });

export const $updateEvent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      eventId: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      durationMinutes: durationMinutesSchema.optional(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getLocalDb();
    const user = await requireAuth();
    const { eventId, ...rest } = data;
    const updated = await updateEvent(eventId, user.id, rest);
    try {
      await syncChainToCalendar(db, user.id, updated.chainId);
    } catch (err) {
      console.error("[sync] post-updateEvent sync failed:", err);
    }
    return updated;
  });

export const $deleteEvent = createServerFn({ method: "POST" })
  .inputValidator(z.object({ eventId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const db = await getLocalDb();
    const user = await requireAuth();
    // Fetch event first to get chainId for post-delete sync
    const existing = await db
      .select({ chainId: events.chainId })
      .from(events)
      .where(eq(events.id, data.eventId))
      .get();
    await deleteEvent(data.eventId, user.id);
    if (existing) {
      try {
        await syncChainToCalendar(db, user.id, existing.chainId);
      } catch (err) {
        console.error("[sync] post-deleteEvent sync failed:", err);
      }
    }
  });

export const $reorderEvents = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      chainId: z.string().uuid(),
      orderedEventIds: z.array(z.string().uuid()).min(1),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getLocalDb();
    const user = await requireAuth();
    await reorderEvents(data.chainId, user.id, data.orderedEventIds);
    try {
      await syncChainToCalendar(db, user.id, data.chainId);
    } catch (err) {
      console.error("[sync] post-reorderEvents sync failed:", err);
    }
  });
