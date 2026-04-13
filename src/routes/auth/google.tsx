import { createFileRoute } from "@tanstack/react-router";

import { $initiateGoogleAuth } from "@/lib/server/auth";

export const Route = createFileRoute("/auth/google")({
  head: () => ({
    title: "Preplan – Sign In",
    meta: [
      {
        name: "description",
        content: "Sign in to Preplan with your Google account.",
      },
    ],
  }),
  loader: () => $initiateGoogleAuth(),
});
