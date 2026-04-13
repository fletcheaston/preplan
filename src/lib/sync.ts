import { asc, eq } from "drizzle-orm";

import type { AnyDb } from "@/db/index";
import { chains, events, users } from "@/db/schema";
import { deriveEventTimes } from "@/lib/time";

import {
  buildEventDateTimes,
  deleteCalendarEvent,
  ensurePreplanCalendar,
  upsertCalendarEvent,
} from "./googleCalendar";

// ---------------------------------------------------------------------------
// Token refresh helper
// ---------------------------------------------------------------------------

/**
 * Refresh the access token if it expires within the next 5 minutes.
 * Returns the current (or newly refreshed) access token.
 */
async function refreshAccessTokenIfNeeded(
  db: AnyDb,
  user: typeof users.$inferSelect,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60;

  if (
    user.googleAccessToken &&
    user.googleTokenExpiry &&
    user.googleTokenExpiry > now + fiveMinutes
  ) {
    return user.googleAccessToken;
  }

  // Need to refresh
  if (!user.googleRefreshToken) {
    throw new Error(
      "No refresh token available — user needs to re-authenticate",
    );
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: user.googleRefreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  });

  if (!response.ok) throw new Error("Token refresh failed");

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  const newExpiry = now + data.expires_in;
  await db
    .update(users)
    .set({ googleAccessToken: data.access_token, googleTokenExpiry: newExpiry })
    .where(eq(users.id, user.id));

  return data.access_token;
}

// ---------------------------------------------------------------------------
// syncChainToCalendar
// ---------------------------------------------------------------------------

/**
 * Sync all events in a chain to Google Calendar.
 * Called after any chain or event mutation.
 * Best-effort — errors are caught and logged.
 */
export async function syncChainToCalendar(
  db: AnyDb,
  userId: string,
  chainId: string,
): Promise<void> {
  try {
    // 1. Fetch the user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();
    if (!user) return;

    // 2. Skip if no Google token
    if (!user.googleAccessToken) return;

    // 3. Refresh token if needed
    const accessToken = await refreshAccessTokenIfNeeded(db, user);

    // 4. Fetch the chain and its events ordered by sortOrder
    const chain = await db
      .select()
      .from(chains)
      .where(eq(chains.id, chainId))
      .get();
    if (!chain) return;

    const chainEvents = await db
      .select()
      .from(events)
      .where(eq(events.chainId, chainId))
      .orderBy(asc(events.sortOrder))
      .all();

    // 5. Ensure the Preplan calendar exists
    const calendarId = await ensurePreplanCalendar(
      accessToken,
      user.gcalCalendarId ?? null,
    );

    // Update cached calendarId in DB if it changed
    if (calendarId !== user.gcalCalendarId) {
      await db
        .update(users)
        .set({ gcalCalendarId: calendarId })
        .where(eq(users.id, userId));
    }

    // 6. Derive start/end times
    const derivedEvents = deriveEventTimes(chain, chainEvents);

    // 7. Upsert each event in Google Calendar
    for (const derived of derivedEvents) {
      const dbEvent = chainEvents.find((e) => e.id === derived.eventId);
      if (!dbEvent) continue;

      const { startDateTime, endDateTime } = buildEventDateTimes(
        derived.startDay,
        derived.startTime,
        derived.endDay,
        derived.endTime,
      );

      const gcalEventId = await upsertCalendarEvent(accessToken, calendarId, {
        gcalEventId: dbEvent.gcalEventId ?? null,
        summary: derived.name,
        startDateTime,
        endDateTime,
      });

      // If this was a create (gcalEventId was null), save the new ID
      if (!dbEvent.gcalEventId) {
        await db
          .update(events)
          .set({ gcalEventId })
          .where(eq(events.id, dbEvent.id));
      }
    }
  } catch (err) {
    console.error(
      `[sync] syncChainToCalendar failed for chain ${chainId}:`,
      err,
    );
  }
}

// ---------------------------------------------------------------------------
// syncDayToCalendar
// ---------------------------------------------------------------------------

/**
 * Sync all chains for a specific day.
 */
export async function syncDayToCalendar(
  db: AnyDb,
  userId: string,
  day: string,
): Promise<void> {
  try {
    const dayChains = await db
      .select()
      .from(chains)
      .where(eq(chains.userId, userId))
      .all();

    const dayChainIds = dayChains.filter((c) => c.day === day).map((c) => c.id);

    for (const chainId of dayChainIds) {
      await syncChainToCalendar(db, userId, chainId);
    }
  } catch (err) {
    console.error(`[sync] syncDayToCalendar failed for day ${day}:`, err);
  }
}

// ---------------------------------------------------------------------------
// unsyncChain
// ---------------------------------------------------------------------------

/**
 * Remove all Google Calendar events for a chain.
 * Called before a chain is deleted from DB.
 */
export async function unsyncChain(
  db: AnyDb,
  userId: string,
  chainId: string,
): Promise<void> {
  try {
    // 1. Fetch user tokens
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();
    if (!user || !user.googleAccessToken) return;

    const accessToken = await refreshAccessTokenIfNeeded(db, user);
    const calendarId = user.gcalCalendarId;
    if (!calendarId) return;

    // 2. Fetch all events in the chain that have a gcalEventId
    const chainEvents = await db
      .select()
      .from(events)
      .where(eq(events.chainId, chainId))
      .all();

    const eventsWithGcal = chainEvents.filter((e) => e.gcalEventId != null);

    // 3. Delete each from Google Calendar
    for (const event of eventsWithGcal) {
      if (!event.gcalEventId) continue;
      await deleteCalendarEvent(accessToken, calendarId, event.gcalEventId);

      // 4. Clear gcalEventId in DB
      await db
        .update(events)
        .set({ gcalEventId: null })
        .where(eq(events.id, event.id));
    }
  } catch (err) {
    console.error(`[sync] unsyncChain failed for chain ${chainId}:`, err);
  }
}
