import { pgTable, text, uuid, decimal, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const paperRecommendations = pgTable(
  'paper_recommendations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    paperId: uuid('paper_id').notNull(),
    score: decimal('score', { precision: 10, scale: 4 }).notNull(),
    reason: text('reason'), // 'collaborative_filtering' | 'content_based' | 'trending' | 'authored_by_followed_author'
    confidence: decimal('confidence', { precision: 10, scale: 4 }),
    metadata: jsonb('metadata').$type<{
      similarPapers: string[];
      sharedAuthors: string[];
      sharedTopics: string[];
    }>(),
    clicked: integer('clicked').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_recommendations_user_id').on(table.userId),
    scoreIdx: index('idx_recommendations_score').on(table.score),
    createdAtIdx: index('idx_recommendations_created_at').on(table.createdAt),
  })
);

export const userInteractions = pgTable(
  'user_interactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    paperId: uuid('paper_id').notNull(),
    interactionType: text('interaction_type').notNull(), // 'view' | 'bookmark' | 'read' | 'share' | 'download' | 'cite'
    duration: integer('duration'), // milliseconds for views/reads
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_interactions_user_id').on(table.userId),
    paperIdIdx: index('idx_interactions_paper_id').on(table.paperId),
    typeIdx: index('idx_interactions_type').on(table.interactionType),
    createdAtIdx: index('idx_interactions_created_at').on(table.createdAt),
  })
);
