import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getSessionCookie, getSessionUser } from "@/lib/session";

const getAuthState = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const sessionId = getSessionCookie(request);
  if (!sessionId) return { authenticated: false as const };

  const { getDb } = await import("@/db/getDb");
  const db = await getDb();
  const user = await getSessionUser(db, sessionId);
  if (!user) return { authenticated: false as const };

  return { authenticated: true as const, user };
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        name: "description",
        content:
          "Plan your day, backwards. Build time-anchored event chains and keep Google Calendar in sync.",
      },
      { property: "og:title", content: "Preplan" },
      {
        property: "og:description",
        content:
          "Build time-anchored event chains and keep Google Calendar in sync.",
      },
    ],
  }),
  loader: async () => {
    const auth = await getAuthState();
    if (auth.authenticated) {
      throw redirect({ to: "/plan" });
    }
    return auth;
  },
  component: App,
});

function App() {
  const data = Route.useLoaderData();

  // Authenticated users are redirected in the loader; this branch is a fallback.
  if (data.authenticated) {
    return null;
  }

  return (
    <main className="page-wrap flex min-h-[70dvh] flex-col items-center justify-center px-4 py-16">
      <div className="rise-in text-center">
        <h1 className="display-title mb-4 text-5xl leading-[1.05] font-bold tracking-tight text-[var(--ink)] sm:text-7xl">
          Preplan
        </h1>
        <p className="mx-auto mb-10 max-w-md text-lg text-[var(--ink-soft)]">
          Plan your day, backwards. Build time-anchored event chains and keep
          Google Calendar in sync.
        </p>
        <a
          href="/auth/google"
          className="inline-block rounded-lg border border-[var(--rule)] bg-[var(--white)] px-6 py-3 text-sm font-semibold text-[var(--ink)] no-underline shadow-sm transition hover:border-[var(--terracotta)] hover:text-[var(--terracotta)]"
        >
          Sign in with Google
        </a>
      </div>
    </main>
  );
}
