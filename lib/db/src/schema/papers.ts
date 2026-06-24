import { pgTable, text, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const papersTable = pgTable("papers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  authors: jsonb("authors").notNull().$type<string[]>(),
  year: integer("year").notNull(),
  abstract: text("abstract").notNull(),
  journal: text("journal"),
  citationCount: integer("citation_count").default(0),
  doi: text("doi"),
  arxivId: text("arxiv_id"),
  url: text("url"),
  field: text("field"),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  noveltyScore: real("novelty_score"),
  relevanceScore: real("relevance_score"),
  isOpenAccess: boolean("is_open_access").default(false),
  savedAt: timestamp("saved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaperSchema = createInsertSchema(papersTable).omit({ createdAt: true });
export type InsertPaper = z.infer<typeof insertPaperSchema>;
export type Paper = typeof papersTable.$inferSelect;
