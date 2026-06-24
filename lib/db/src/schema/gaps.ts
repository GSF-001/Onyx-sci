import { pgTable, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const researchGapsTable = pgTable("research_gaps", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  impactScore: real("impact_score").notNull(),
  competitionLevel: text("competition_level").notNull(),
  difficultyLevel: text("difficulty_level").notNull(),
  field: text("field").notNull(),
  relatedPapers: integer("related_papers").default(0).notNull(),
  opportunity: text("opportunity"),
  discoveredAt: timestamp("discovered_at").defaultNow().notNull(),
});

export const insertGapSchema = createInsertSchema(researchGapsTable).omit({ discoveredAt: true });
export type InsertGap = z.infer<typeof insertGapSchema>;
export type ResearchGap = typeof researchGapsTable.$inferSelect;
