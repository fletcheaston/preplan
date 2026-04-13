import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/getDb";
import { users } from "@/db/schema";
import { getGoogleOAuth } from "@/lib/auth";
import { requireAuth } from "@/lib/requireAuth";
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getSessionCookie,
  setSessionCookie,
} from "@/lib/session";

export const $initiateGoogleAuth = createServerFn({ method: "GET" }).handler(
  async () => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    const google = getGoogleOAuth({
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
    });

    const url = google.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar",
    ]);

    const oauthPayload = btoa(JSON.stringify({ state, codeVerifier }));
    throw redirect({
      href: url.toString(),
      headers: {
        "Set-Cookie": `oauth_data=${oauthPayload}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
      },
    });
  },
);

export const $handleCallback = createServerFn({ method: "GET" }).handler(
  async () => {
    const db = await getDb();
    const request = getRequest();
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const cookie = request.headers.get("cookie") ?? "";
    const oauthDataRaw = cookie.match(/oauth_data=([^;]+)/)?.[1];
    let storedState: string | undefined;
    let codeVerifier: string | undefined;
    if (oauthDataRaw) {
      try {
        const parsed = JSON.parse(atob(oauthDataRaw));
        storedState = parsed.state;
        codeVerifier = parsed.codeVerifier;
      } catch {
        // malformed cookie
      }
    }

    if (
      !code ||
      !state ||
      !storedState ||
      !codeVerifier ||
      state !== storedState
    ) {
      throw new Error("Invalid OAuth state");
    }

    const google = getGoogleOAuth({
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
    });

    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const idToken = tokens.idToken();
    const claims = decodeIdToken(idToken) as {
      sub: string;
      email: string;
      name: string;
      picture?: string;
    };

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.googleSub, claims.sub))
      .get();

    let userId: string;
    if (existing) {
      userId = existing.id;
      await db
        .update(users)
        .set({
          email: claims.email,
          displayName: claims.name,
          avatarUrl: claims.picture,
          googleAccessToken: tokens.accessToken(),
          googleRefreshToken: tokens.hasRefreshToken()
            ? tokens.refreshToken()
            : existing.googleRefreshToken,
          googleTokenExpiry: Math.floor(
            tokens.accessTokenExpiresAt().getTime() / 1000,
          ),
        })
        .where(eq(users.id, userId));
    } else {
      userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        googleSub: claims.sub,
        email: claims.email,
        displayName: claims.name,
        avatarUrl: claims.picture ?? null,
        googleAccessToken: tokens.accessToken(),
        googleRefreshToken: tokens.hasRefreshToken()
          ? tokens.refreshToken()
          : null,
        googleTokenExpiry: Math.floor(
          tokens.accessTokenExpiresAt().getTime() / 1000,
        ),
      });
    }

    const sessionId = await createSession(db, userId);

    throw redirect({
      href: "/",
      headers: {
        "Set-Cookie": setSessionCookie(sessionId),
      },
    });
  },
);

export const $logout = createServerFn({ method: "POST" }).handler(async () => {
  const db = await getDb();
  const request = getRequest();
  const sessionId = getSessionCookie(request);
  if (sessionId) {
    await deleteSession(db, sessionId);
  }
  throw redirect({
    href: "/auth/google",
    headers: { "Set-Cookie": clearSessionCookie() },
  });
});

export const $checkAuth = createServerFn({ method: "GET" })
  .inputValidator(z.object({}).optional())
  .handler(async () => {
    await requireAuth();
  });
