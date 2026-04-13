import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/demo/drizzle")({
  component: DemoDrizzle,
});

function DemoDrizzle() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-6 sm:p-8">
        <p className="mb-2 text-xs font-medium tracking-wider text-[var(--ink-soft)] uppercase">
          Demo
        </p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--ink)] sm:text-5xl">
          Drizzle Demo
        </h1>
        <p className="text-base text-[var(--ink-soft)]">
          This demo has been retired. See the main app for Drizzle usage.
        </p>
      </section>
    </main>
  );
}
