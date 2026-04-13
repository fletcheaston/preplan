import { drizzle as drizzleD1 } from "drizzle-orm/d1";

import type { LocalDb } from "./local";
import * as schema from "./schema";

export type Env = {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET: string;
};

export function getDb(env: Env) {
  return drizzleD1(env.DB, { schema });
}

export type DbClient = ReturnType<typeof getDb>;
export type LocalDbClient = LocalDb;
/** Union type accepted by sync helpers — works with both D1 and local SQLite. */
export type AnyDb = DbClient | LocalDbClient;
