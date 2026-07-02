import { Router } from 'express';
import { discussionService } from '../services/discussionService';
import { requireAuth } from '../middlewares/auth';
import { errorHandler } from '../lib/errorHandler';
import { z } from 'zod';

const router = Router();

const CreateThreadSchema = z.object({
  paperId: z.string().uuid(),
  title: z.string().min(5).max(200),
  content: z.string().min(20).max(5000),
  category: z.enum(['question', 'comment', 'insight', 'methodology', 'results']),
});

const CreateReplySchema = z.object({
  content: z.string().min(10).max(5000),
});

// Get all threads for a paper
router.get('/papers/:paperId', errorHandler(async (req, res) => {
  const { paperId } = req.params;
  const category = req.query.category as string | undefined;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const threads = await discussionService.getThreads(
    paperId,
    category,
    limit,
    offset
  );

  res.json({
    status: 'success',
    data: threads,
  });
}));

// Get single thread with replies
router.get('/threads/:threadId', errorHandler(async (req, res) => {
  const { threadId } = req.params;

  const thread = await discussionService.getThread(threadId);

  res.json({
    status: 'success',
    data: thread,
  });
}));

// Create new thread
router.post('/threads', requireAuth, errorHandler(async (req, res) => {
  const userId = req.user?.id!;
  const input = CreateThreadSchema.parse(req.body);

  const thread = await discussionService.createThread(userId, input);

  res.status(201).json({
    status: 'success',
    data: thread,
  });
}));

// Create reply to thread
router.post('/threads/:threadId/replies', requireAuth, errorHandler(async (req, res) => {
  const userId = req.user?.id!;
  const { threadId } = req.params;
  const input = CreateReplySchema.parse(req.body);

  const reply = await discussionService.createReply(userId, {
    threadId,
    ...input,
  });

  res.status(201).json({
    status: 'success',
    data: reply,
  });
}));

// Upvote thread
router.post('/threads/:threadId/upvote', requireAuth, errorHandler(async (req, res) => {
  const userId = req.user?.id!;
  const { threadId } = req.params;

  await discussionService.upvoteThread(threadId, userId);

  res.json({
    status: 'success',
    data: { message: 'Upvoted' },
  });
}));

// Upvote reply
router.post('/replies/:replyId/upvote', requireAuth, errorHandler(async (req, res) => {
  const { replyId } = req.params;

  await discussionService.upvoteReply(replyId);

  res.json({
    status: 'success',
    data: { message: 'Upvoted' },
  });
}));

// Mark reply as answer
router.post('/replies/:replyId/mark-as-answer', requireAuth, errorHandler(async (req, res) => {
  const { replyId } = req.params;
  const { threadId } = req.body;

  await discussionService.markAsAnswer(replyId, threadId);

  res.json({
    status: 'success',
    data: { message: 'Marked as answer' },
  });
}));

// Close thread
router.post('/threads/:threadId/close', requireAuth, errorHandler(async (req, res) => {
  const { threadId } = req.params;

  await discussionService.closeThread(threadId);

  res.json({
    status: 'success',
    data: { message: 'Thread closed' },
  });
}));

// Pin/unpin thread
router.post('/threads/:threadId/pin', requireAuth, errorHandler(async (req, res) => {
  const { threadId } = req.params;

  await discussionService.pinThread(threadId);

  res.json({
    status: 'success',
    data: { message: 'Thread pinned/unpinned' },
  });
}));

export default router;
