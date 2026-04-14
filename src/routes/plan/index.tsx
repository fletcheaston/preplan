import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

const detectMobile = createServerFn({ method: "GET" }).handler(() => {
  const ua = getRequestHeader("user-agent") ?? "";
  return /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
});

function getThisMonday(today: string): string {
  const d = new Date(`${today}T12:00:00Z`);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const Route = createFileRoute("/plan/")({
  loader: async () => {
    const today = new Date().toISOString().split("T")[0];
    const thisMonday = getThisMonday(today);

    // Detect mobile: matchMedia on client, User-Agent on server
    let isMobile: boolean;
    if (typeof window !== "undefined") {
      isMobile = window.matchMedia("(max-width: 767px)").matches;
    } else {
      isMobile = await detectMobile();
    }

    if (isMobile) {
      throw redirect({ to: "/plan/$date", params: { date: today } });
    }
    throw redirect({
      to: "/plan/week/$weekStart",
      params: { weekStart: thisMonday },
    });
  },
  component: () => null,
});
