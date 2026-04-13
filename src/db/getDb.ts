// Unified database access — works in both Cloudflare Workers (D1) and local dev (better-sqlite3).
// Returns DbClient type (D1 drizzle) which is API-compatible with BetterSQLite3Database.
import { getCfEnv } from "./cf-env";
import type { DbClient } from "./index";
import { getDb as getD1Db } from "./index";

export async function getDb(): Promise<DbClient> {
  // Check for Cloudflare D1 binding first
  const env = getCfEnv();
  if (env?.DB) {
    return getD1Db(env);
  }

  // Fall back to local better-sqlite3 for dev
  const { getLocalDb } = await import("./local");
  return getLocalDb() as unknown as Promise<DbClient>;
}
