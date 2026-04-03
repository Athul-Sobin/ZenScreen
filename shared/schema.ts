import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sleepLogs = pgTable("sleep_logs", {
  id: varchar("id").primaryKey(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  isAutoDetected: boolean("is_auto_detected").notNull(),
  qualityRating: integer("quality_rating"),
});

export const appUsageLogs = pgTable("app_usage_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  appId: varchar("app_id").notNull(),
  minutes: integer("minutes").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSleepLogSchema = createInsertSchema(sleepLogs).pick({
  id: true,
  startTime: true,
  endTime: true,
  durationMinutes: true,
  isAutoDetected: true,
  qualityRating: true,
});

export const insertAppUsageLogSchema = createInsertSchema(appUsageLogs).pick({
  appId: true,
  minutes: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSleepLog = z.infer<typeof insertSleepLogSchema>;
export type SleepLog = typeof sleepLogs.$inferSelect;

export type InsertAppUsageLog = z.infer<typeof insertAppUsageLogSchema>;
export type AppUsageLog = typeof appUsageLogs.$inferSelect;
