import { eq } from "drizzle-orm";

import { sessions, users } from "@/db/schema";

export type { User } from "@/db/schema";

// Use a flexible db type that works with both better-sqlite3 (local) and D1 (production)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = any;

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(
  db: AnyDb,
  userId: string,
): Promise<string> {
  const id = crypto.randomUUID();
  const expiresAt = Math.floor((Date.now() + SESSION_DURATION_MS) / 1000);
  await db.insert(sessions).values({ id, userId, expiresAt });
  return id;
}

export async function getSessionUser(
  db: AnyDb,
  sessionId: string,
): Promise<import("@/db/schema").User | null> {
  const now = Math.floor(Date.now() / 1000);

  const result = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .get();

  if (!result || result.expiresAt < now) {
    if (result) await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }

  return result.user;
}

export async function deleteSession(
  db: AnyDb,
  sessionId: string,
): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export function getSessionCookie(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/session=([^;]+)/);
  return match ? match[1] : null;
}

export function setSessionCookie(sessionId: string): string {
  const maxAge = 30 * 24 * 60 * 60;
  return `session=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}
