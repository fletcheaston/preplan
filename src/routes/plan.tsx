import { Outlet, createFileRoute } from "@tanstack/react-router";

import { $checkAuth } from "@/lib/server/auth";

export const Route = createFileRoute("/plan")({
  beforeLoad: async () => {
    await $checkAuth();
  },
  component: () => <Outlet />,
});
