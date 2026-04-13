import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/demo/drizzle")({
  component: DemoDrizzle,
});

function DemoDrizzle() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Demo</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          Drizzle Demo
        </h1>
        <p className="text-base text-[var(--sea-ink-soft)]">
          This demo has been retired. See the main app for Drizzle usage.
        </p>
      </section>
    </main>
  );
}
