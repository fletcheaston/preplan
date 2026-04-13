import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  googleSub: text("google_sub").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiry: integer("google_token_expiry"),
  gcalCalendarId: text("gcal_calendar_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const chains = sqliteTable("chains", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  day: text("day").notNull(), // ISO date YYYY-MM-DD
  name: text("name").notNull(),
  anchorTime: text("anchor_time").notNull(), // HH:MM 24h
  direction: text("direction", { enum: ["forward", "backward"] })
    .notNull()
    .default("backward"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  chainId: text("chain_id")
    .notNull()
    .references(() => chains.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  durationMinutes: integer("duration_minutes").notNull(), // multiples of 15, max 720
  sortOrder: integer("sort_order").notNull().default(1000),
  gcalEventId: text("gcal_event_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Chain = typeof chains.$inferSelect;
export type Event = typeof events.$inferSelect;
export type NewChain = typeof chains.$inferInsert;
export type NewEvent = typeof events.$inferInsert;
