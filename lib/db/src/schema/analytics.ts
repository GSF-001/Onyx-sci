import { pgTable, text, integer, decimal, timestamp, jsonb, uuid, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const paperAnalytics = pgTable(
  'paper_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paperId: uuid('paper_id').notNull(),
    userId: text('user_id').notNull(),
    citationCount: integer('citation_count').default(0),
    readCount: integer('read_count').default(0),
    influenceScore: decimal('influence_score', { precision: 10, scale: 4 }).default('0'),
    trendingScore: decimal('trending_score', { precision: 10, scale: 4 }).default('0'),
    impactCategory: text('impact_category'), // 'high' | 'medium' | 'low'
    lastAnalyzedAt: timestamp('last_analyzed_at').defaultNow(),
    metadata: jsonb('metadata').$type<{
      coAuthors: number;
      venues: string[];
      keywords: string[];
      yearDelta: number;
    }>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    paperIdIdx: index('idx_paper_analytics_paper_id').on(table.paperId),
    userIdIdx: index('idx_paper_analytics_user_id').on(table.userId),
    influenceIdx: index('idx_paper_analytics_influence').on(table.influenceScore),
  })
);

export const userReadingPatterns = pgTable(
  'user_reading_patterns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().unique(),
    totalPapersRead: integer('total_papers_read').default(0),
    averageReadTime: integer('average_read_time').default(0), // minutes
    preferredTopics: text('preferred_topics').array(),
    preferredAuthors: text('preferred_authors').array(),
    readingStreak: integer('reading_streak').default(0), // days
    mostActiveDay: text('most_active_day'),
    engagementLevel: text('engagement_level'), // 'high' | 'medium' | 'low'
    lastReadAt: timestamp('last_read_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_reading_patterns_user_id').on(table.userId),
    engagementIdx: index('idx_reading_patterns_engagement').on(table.engagementLevel),
  })
);

export const paperTrends = pgTable(
  'paper_trends',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    topic: text('topic').notNull(),
    year: integer('year').notNull(),
    paperCount: integer('paper_count').default(0),
    citationGrowth: decimal('citation_growth', { precision: 10, scale: 4 }).default('0'),
    authorCount: integer('author_count').default(0),
    trendDirection: text('trend_direction'), // 'rising' | 'stable' | 'declining'
    momentum: decimal('momentum', { precision: 10, scale: 4 }).default('0'),
    keywords: text('keywords').array(),
    relatedTopics: text('related_topics').array(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    topicYearIdx: index('idx_trends_topic_year').on(table.topic, table.year),
    trendIdx: index('idx_trends_direction').on(table.trendDirection),
  })
);
