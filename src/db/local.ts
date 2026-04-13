// Local dev database using better-sqlite3.
// Lazy-initialized so better-sqlite3 is never loaded on the client.
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

export type LocalDb = BetterSQLite3Database<typeof schema>;

let _localDb: LocalDb | null = null;

export async function getLocalDb(): Promise<LocalDb> {
  if (!_localDb) {
    const { default: Database } = await import("better-sqlite3");
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
    const sqlite = new Database(process.env.DATABASE_URL ?? "local.db");
    _localDb = drizzle(sqlite, { schema });
  }
  return _localDb;
}
