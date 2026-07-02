import { Router } from 'express';
import { recommendationService } from '../services/recommendationService';
import { requireAuth } from '../middlewares/auth';
import { errorHandler } from '../lib/errorHandler';

const router = Router();

// Get hybrid recommendations
router.get('/', requireAuth, errorHandler(async (req, res) => {
  const userId = req.user?.id!;
  const limit = parseInt(req.query.limit as string) || 20;

  const recommendations = await recommendationService.generateHybridRecommendations(
    userId,
    limit
  );

  res.json({
    status: 'success',
    data: recommendations,
  });
}));

// Get collaborative filtering recommendations
router.get('/collaborative', requireAuth, errorHandler(async (req, res) => {
  const userId = req.user?.id!;
  const limit = parseInt(req.query.limit as string) || 20;

  const recommendations =
    await recommendationService.generateCollaborativeRecommendations(
      userId,
      limit
    );

  res.json({
    status: 'success',
    data: recommendations,
  });
}));

// Get trending recommendations
router.get('/trending', requireAuth, errorHandler(async (req, res) => {
  const userId = req.user?.id!;
  const limit = parseInt(req.query.limit as string) || 20;

  const recommendations = await recommendationService.generateTrendingRecommendations(
    userId,
    limit
  );

  res.json({
    status: 'success',
    data: recommendations,
  });
}));

// Track recommendation click
router.post('/:recommendationId/click', requireAuth, errorHandler(async (req, res) => {
  const { recommendationId } = req.params;

  await recommendationService.trackRecommendationClick(recommendationId);

  res.json({
    status: 'success',
    data: { message: 'Click tracked' },
  });
}));

export default router;
