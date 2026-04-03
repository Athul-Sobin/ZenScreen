import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sleepLogs = sqliteTable("sleep_logs", {
  id: text("id").primaryKey(),
  startTime: integer("start_time", { mode: 'timestamp' }).notNull(),
  endTime: integer("end_time", { mode: 'timestamp' }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  isAutoDetected: integer("is_auto_detected", { mode: 'boolean' }).notNull(),
  qualityRating: integer("quality_rating"),
});

export const appUsageLogs = sqliteTable("app_usage_logs", {
  id: text("id").primaryKey(),
  appId: text("app_id").notNull(),
  minutes: integer("minutes").notNull(),
  timestamp: integer("timestamp", { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
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
