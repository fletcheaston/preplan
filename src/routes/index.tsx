import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getSessionCookie, getSessionUser } from "@/lib/session";

const getAuthState = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const sessionId = getSessionCookie(request);
  if (!sessionId) return { authenticated: false as const };

  const { getLocalDb } = await import("@/db/local");
  const db = await getLocalDb();
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
    <main className="page-wrap px-4 pt-14 pb-8">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -top-24 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">Preplan</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Plan your day, backwards.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Build time-anchored event chains and export them to Google Calendar.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/auth/google"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
          >
            Sign in with Google
          </a>
        </div>
      </section>
    </main>
  );
}
