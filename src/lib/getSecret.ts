// Read secrets from Cloudflare env binding (prod) or process.env (local dev).
import { getCfEnv } from "@/db/cf-env";

export function getSecret(name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "SESSION_SECRET"): string {
  const cfEnv = getCfEnv();
  if (cfEnv && cfEnv[name]) {
    return cfEnv[name];
  }
  return process.env[name] ?? "";
}
