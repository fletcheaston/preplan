import { redirect } from "@tanstack/react-router";
import { getRequest } from "@tanstack/react-start/server";

import { getDb } from "@/db/getDb";
import type { User } from "@/db/schema";
import { getSessionCookie, getSessionUser } from "@/lib/session";

export async function requireAuth(): Promise<User> {
  const db = await getDb();
  const request = getRequest();
  const sessionId = getSessionCookie(request);
  if (!sessionId) throw redirect({ href: "/auth/google" });

  const user = await getSessionUser(db, sessionId);
  if (!user) throw redirect({ href: "/auth/google" });

  return user;
}
