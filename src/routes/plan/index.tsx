import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import { getLocalThisMonday, getLocalToday } from "@/lib/time";

const detectMobile = createServerFn({ method: "GET" }).handler(() => {
  const ua = getRequestHeader("user-agent") ?? "";
  return /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
});

export const Route = createFileRoute("/plan/")({
  loader: async () => {
    const today = getLocalToday();
    const thisMonday = getLocalThisMonday();

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
