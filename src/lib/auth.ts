import { Google } from "arctic";

import { getCfEnv } from "@/db/cf-env";

export function getGoogleOAuth(env: {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}) {
  // On Cloudflare (detected via cf-env binding), use production URL.
  // Locally, use VITE_BASE_URL or localhost.
  const isCloudflare = getCfEnv() !== null;
  const baseUrl = isCloudflare
    ? "https://preplan.fletcheaston.com"
    : (process.env.VITE_BASE_URL ?? "http://localhost:3000");
  return new Google(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/auth/callback`,
  );
}
