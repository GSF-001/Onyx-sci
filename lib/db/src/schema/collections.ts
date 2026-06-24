import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const collectionsTable = pgTable("collections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  paperCount: integer("paper_count").default(0).notNull(),
  isShared: boolean("is_shared").default(false).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  paperIds: jsonb("paper_ids").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCollectionSchema = createInsertSchema(collectionsTable).omit({ createdAt: true, updatedAt: true });
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collectionsTable.$inferSelect;
