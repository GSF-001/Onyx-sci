import { Router } from 'express';
import { analyticsService } from '../services/analyticsService';
import { requireAuth } from '../middlewares/auth';
import { errorHandler } from '../lib/errorHandler';

const router = Router();

// Get paper analytics
router.get('/papers/:paperId', requireAuth, errorHandler(async (req, res) => {
  const { paperId } = req.params;
  const userId = req.user?.id!;

  const analytics = await analyticsService.getPaperAnalytics(paperId, userId);

  res.json({
    status: 'success',
    data: analytics,
  });
}));

// Get trending topics
router.get('/trending/topics', requireAuth, errorHandler(async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const trends = await analyticsService.getTrendingTopics(days);

  res.json({
    status: 'success',
    data: trends,
  });
}));

// Get user dashboard
router.get('/dashboard', requireAuth, errorHandler(async (req, res) => {
  const userId = req.user?.id!;
  const dashboard = await analyticsService.getUserDashboard(userId);

  res.json({
    status: 'success',
    data: dashboard,
  });
}));

// Calculate influence score for a paper
router.post('/calculate-influence/:paperId', requireAuth, errorHandler(async (req, res) => {
  const { paperId } = req.params;
  const score = await analyticsService.calculateInfluenceScore(paperId);

  res.json({
    status: 'success',
    data: { paperId, influenceScore: score },
  });
}));

export default router;
