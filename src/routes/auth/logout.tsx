import { createFileRoute } from "@tanstack/react-router";

import { $logout } from "@/lib/server/auth";

export const logoutFn = $logout;

export const Route = createFileRoute("/auth/logout")({
  component: () => null,
});
