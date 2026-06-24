import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const copilotSessionsTable = pgTable("copilot_sessions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  messageCount: integer("message_count").default(0).notNull(),
  lastMessage: text("last_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const copilotMessagesTable = pgTable("copilot_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  citations: jsonb("citations").$type<object[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(copilotSessionsTable).omit({ createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(copilotMessagesTable).omit({ createdAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type CopilotSession = typeof copilotSessionsTable.$inferSelect;
export type CopilotMessage = typeof copilotMessagesTable.$inferSelect;
