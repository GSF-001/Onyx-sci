import { pgTable, text, uuid, timestamp, integer, index } from 'drizzle-orm/pg-core';

export const citationFormats = pgTable(
  'citation_formats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paperId: uuid('paper_id').notNull(),
    apa: text('apa').notNull(),
    mla: text('mla').notNull(),
    bibtex: text('bibtex').notNull(),
    chicago: text('chicago').notNull(),
    harvard: text('harvard').notNull(),
    ieee: text('ieee').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    paperIdIdx: index('idx_citations_paper_id').on(table.paperId).unique(),
  })
);

export const exportHistories = pgTable(
  'export_histories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    paperId: uuid('paper_id').notNull(),
    format: text('format').notNull(), // 'apa' | 'mla' | 'bibtex' | 'chicago' | 'harvard' | 'ieee' | 'pdf' | 'epub'
    exportType: text('export_type'), // 'single' | 'collection' | 'bibliography'
    collectionId: uuid('collection_id'),
    fileName: text('file_name'),
    fileSize: integer('file_size'), // bytes
    downloadCount: integer('download_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_export_histories_user_id').on(table.userId),
    paperIdIdx: index('idx_export_histories_paper_id').on(table.paperId),
    formatIdx: index('idx_export_histories_format').on(table.format),
  })
);
