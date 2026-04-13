const GCAL_BASE = "https://www.googleapis.com/calendar/v3";

/**
 * Ensure the "Preplan" calendar exists in the user's Google Calendar account.
 * Returns the calendarId string.
 * - If cachedCalendarId is provided, verify it still exists (optimistic path).
 * - Otherwise scan calendarList for "Preplan", or create it.
 */
export async function ensurePreplanCalendar(
  accessToken: string,
  cachedCalendarId: string | null,
): Promise<string> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Fast path: cached ID provided — trust it
  if (cachedCalendarId) {
    return cachedCalendarId;
  }

  // Scan the user's calendar list for one named "Preplan"
  const listRes = await fetch(`${GCAL_BASE}/users/me/calendarList`, {
    headers,
  });
  if (!listRes.ok) {
    throw new Error(
      `Failed to list calendars: ${listRes.status} ${await listRes.text()}`,
    );
  }

  const listData = (await listRes.json()) as {
    items?: Array<{ id: string; summary: string }>;
  };

  const existing = listData.items?.find((c) => c.summary === "Preplan");
  if (existing) {
    return existing.id;
  }

  // Create a new "Preplan" calendar
  const createRes = await fetch(`${GCAL_BASE}/calendars`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ summary: "Preplan" }),
  });

  if (!createRes.ok) {
    throw new Error(
      `Failed to create calendar: ${createRes.status} ${await createRes.text()}`,
    );
  }

  const created = (await createRes.json()) as { id: string };
  return created.id;
}

/**
 * Upsert a calendar event.
 * - If gcalEventId is null: POST (create), returns the new Google event ID.
 * - If gcalEventId is non-null: PUT (update), returns the same gcalEventId.
 */
export async function upsertCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: {
    gcalEventId: string | null;
    summary: string;
    startDate: string; // "YYYY-MM-DD"
    startTime: string; // "HH:MM"
    endDate: string;
    endTime: string;
    timeZone: string; // IANA timezone e.g. "America/Los_Angeles"
  },
): Promise<string> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    summary: event.summary,
    start: {
      dateTime: `${event.startDate}T${event.startTime}:00`,
      timeZone: event.timeZone,
    },
    end: {
      dateTime: `${event.endDate}T${event.endTime}:00`,
      timeZone: event.timeZone,
    },
  });

  let res: Response;

  if (event.gcalEventId === null) {
    // Create
    res = await fetch(
      `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers,
        body,
      },
    );
  } else {
    // Update
    res = await fetch(
      `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(event.gcalEventId)}`,
      { method: "PUT", headers, body },
    );
  }

  if (!res.ok) {
    throw new Error(
      `Failed to upsert calendar event: ${res.status} ${await res.text()}`,
    );
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}

/**
 * Delete a calendar event. Swallows 404s (already deleted).
 */
export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  gcalEventId: string,
): Promise<void> {
  const res = await fetch(
    `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(gcalEventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok && res.status !== 404) {
    throw new Error(
      `Failed to delete calendar event: ${res.status} ${await res.text()}`,
    );
  }
}
