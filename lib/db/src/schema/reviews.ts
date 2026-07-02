import { pgTable, text, uuid, integer, timestamp, jsonb, index, unique } from 'drizzle-orm/pg-core';

export const paperReviews = pgTable(
  'paper_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paperId: uuid('paper_id').notNull(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    rating: integer('rating').notNull(), // 1-5
    clarity: integer('clarity'), // 1-5
    novelty: integer('novelty'), // 1-5
    significance: integer('significance'), // 1-5
    methodology: integer('methodology'), // 1-5
    upvotes: integer('upvotes').default(0),
    downvotes: integer('downvotes').default(0),
    status: text('status').default('published'), // 'draft' | 'published' | 'archived'
    isAnonymous: integer('is_anonymous').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    paperIdIdx: index('idx_reviews_paper_id').on(table.paperId),
    userIdIdx: index('idx_reviews_user_id').on(table.userId),
    ratingIdx: index('idx_reviews_rating').on(table.rating),
    unique_review: unique().on(table.paperId, table.userId),
  })
);

export const discussionThreads = pgTable(
  'discussion_threads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paperId: uuid('paper_id').notNull(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    category: text('category'), // 'question' | 'comment' | 'insight' | 'methodology' | 'results'
    replies: integer('replies').default(0),
    upvotes: integer('upvotes').default(0),
    isPinned: integer('is_pinned').default(0),
    status: text('status').default('open'), // 'open' | 'answered' | 'closed'
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    paperIdIdx: index('idx_threads_paper_id').on(table.paperId),
    userIdIdx: index('idx_threads_user_id').on(table.userId),
    categoryIdx: index('idx_threads_category').on(table.category),
    pinnedIdx: index('idx_threads_pinned').on(table.isPinned),
  })
);

export const threadReplies = pgTable(
  'thread_replies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id').notNull(),
    userId: text('user_id').notNull(),
    content: text('content').notNull(),
    upvotes: integer('upvotes').default(0),
    downvotes: integer('downvotes').default(0),
    isMarkedAsAnswer: integer('is_marked_as_answer').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    threadIdIdx: index('idx_replies_thread_id').on(table.threadId),
    userIdIdx: index('idx_replies_user_id').on(table.userId),
  })
);
