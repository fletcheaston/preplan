import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/plan/")({
  loader: () => {
    const today = new Date().toISOString().split("T")[0];
    // Get this week's Monday
    const d = new Date(`${today}T12:00:00Z`);
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diff);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const thisMonday = `${yyyy}-${mm}-${dd}`;

    throw redirect({
      to: "/plan/week/$weekStart",
      params: { weekStart: thisMonday },
    });
  },
  component: () => null,
});
