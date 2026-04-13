// Unified database access — works in both Cloudflare Workers (D1) and local dev (better-sqlite3).
import type { DbClient, Env } from "./index";
import { getDb as getD1Db } from "./index";

export async function getDb(): Promise<DbClient> {
  // Try the Cloudflare Workers runtime first via cloudflare:workers module.
  // This only resolves when running on Cloudflare — import will fail in local dev.
  try {
    const cf = (await import("cloudflare:workers" as string)) as {
      env: Env;
    };
    if (cf.env?.DB) {
      return getD1Db(cf.env);
    }
  } catch {
    // Not in Cloudflare Workers runtime — fall through
  }

  // Fall back to local better-sqlite3 for dev
  const { getLocalDb } = await import("./local");
  return getLocalDb() as unknown as DbClient;
}
