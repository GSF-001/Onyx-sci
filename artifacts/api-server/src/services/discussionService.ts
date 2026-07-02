import { db } from '@workspace/db';
import { discussionThreads, threadReplies } from '@workspace/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const CreateThreadSchema = z.object({
  paperId: z.string().uuid(),
  title: z.string().min(5).max(200),
  content: z.string().min(20).max(5000),
  category: z.enum(['question', 'comment', 'insight', 'methodology', 'results']),
});

const CreateReplySchema = z.object({
  threadId: z.string().uuid(),
  content: z.string().min(10).max(5000),
});

type CreateThreadInput = z.infer<typeof CreateThreadSchema>;
type CreateReplyInput = z.infer<typeof CreateReplySchema>;

export class DiscussionService {
  async createThread(
    userId: string,
    input: CreateThreadInput
  ) {
    const validated = CreateThreadSchema.parse(input);

    const [thread] = await db
      .insert(discussionThreads)
      .values({
        paperId: validated.paperId,
        userId,
        title: validated.title,
        content: validated.content,
        category: validated.category,
        replies: 0,
        upvotes: 0,
        status: 'open',
      })
      .returning();

    return thread;
  }

  async createReply(
    userId: string,
    input: CreateReplyInput
  ) {
    const validated = CreateReplySchema.parse(input);

    // Verify thread exists
    const thread = await db.query.discussionThreads.findFirst({
      where: eq(discussionThreads.id, validated.threadId),
    });

    if (!thread) {
      throw new Error('Thread not found');
    }

    const [reply] = await db
      .insert(threadReplies)
      .values({
        threadId: validated.threadId,
        userId,
        content: validated.content,
        upvotes: 0,
        downvotes: 0,
      })
      .returning();

    // Update thread reply count
    await db
      .update(discussionThreads)
      .set({ replies: thread.replies + 1 })
      .where(eq(discussionThreads.id, validated.threadId));

    return reply;
  }

  async getThreads(
    paperId: string,
    category?: string,
    limit: number = 20,
    offset: number = 0
  ) {
    const where = category
      ? and(
          eq(discussionThreads.paperId, paperId),
          eq(discussionThreads.category, category)
        )
      : eq(discussionThreads.paperId, paperId);

    const threads = await db.query.discussionThreads.findMany({
      where,
      orderBy: [
        desc(discussionThreads.isPinned),
        desc(discussionThreads.upvotes),
        desc(discussionThreads.createdAt),
      ],
      limit,
      offset,
    });

    return threads;
  }

  async getThread(threadId: string) {
    const thread = await db.query.discussionThreads.findFirst({
      where: eq(discussionThreads.id, threadId),
    });

    if (!thread) {
      throw new Error('Thread not found');
    }

    const replies = await db.query.threadReplies.findMany({
      where: eq(threadReplies.threadId, threadId),
      orderBy: [
        desc(threadReplies.isMarkedAsAnswer),
        desc(threadReplies.upvotes),
        desc(threadReplies.createdAt),
      ],
    });

    return {
      ...thread,
      replies,
    };
  }

  async upvoteThread(threadId: string, userId: string) {
    const thread = await db.query.discussionThreads.findFirst({
      where: eq(discussionThreads.id, threadId),
    });

    if (!thread) {
      throw new Error('Thread not found');
    }

    await db
      .update(discussionThreads)
      .set({ upvotes: thread.upvotes + 1 })
      .where(eq(discussionThreads.id, threadId));
  }

  async upvoteReply(replyId: string) {
    const reply = await db.query.threadReplies.findFirst({
      where: eq(threadReplies.id, replyId),
    });

    if (!reply) {
      throw new Error('Reply not found');
    }

    await db
      .update(threadReplies)
      .set({ upvotes: reply.upvotes + 1 })
      .where(eq(threadReplies.id, replyId));
  }

  async markAsAnswer(replyId: string, threadId: string) {
    // Only one answer per thread
    await db
      .update(threadReplies)
      .set({ isMarkedAsAnswer: 0 })
      .where(eq(threadReplies.threadId, threadId));

    // Mark this reply as answer
    await db
      .update(threadReplies)
      .set({ isMarkedAsAnswer: 1 })
      .where(eq(threadReplies.id, replyId));

    // Update thread status
    await db
      .update(discussionThreads)
      .set({ status: 'answered' })
      .where(eq(discussionThreads.id, threadId));
  }

  async closeThread(threadId: string) {
    await db
      .update(discussionThreads)
      .set({ status: 'closed' })
      .where(eq(discussionThreads.id, threadId));
  }

  async pinThread(threadId: string) {
    const thread = await db.query.discussionThreads.findFirst({
      where: eq(discussionThreads.id, threadId),
    });

    if (!thread) {
      throw new Error('Thread not found');
    }

    await db
      .update(discussionThreads)
      .set({ isPinned: thread.isPinned ? 0 : 1 })
      .where(eq(discussionThreads.id, threadId));
  }
}

export const discussionService = new DiscussionService();
