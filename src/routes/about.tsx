import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-6 sm:p-8">
        <p className="mb-2 text-xs font-medium tracking-wider text-[var(--ink-soft)] uppercase">
          About
        </p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--ink)] sm:text-5xl">
          A small starter with room to grow.
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-[var(--ink-soft)]">
          TanStack Start gives you type-safe routing, server functions, and
          modern SSR defaults. Use this as a clean foundation, then layer in
          your own routes, styling, and add-ons.
        </p>
      </section>
    </main>
  );
}
