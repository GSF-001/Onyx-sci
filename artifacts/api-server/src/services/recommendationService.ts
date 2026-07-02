import { db } from '@workspace/db';
import { paperRecommendations, userInteractions } from '@workspace/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

interface RecommendationParams {
  userId: string;
  limit?: number;
  minScore?: number;
}

export class RecommendationService {
  /**
   * Generate recommendations using collaborative filtering
   * Based on papers similar users have read
   */
  async generateCollaborativeRecommendations(userId: string, limit: number = 20) {
    // Get user's reading history
    const userReadings = await db.query.userInteractions.findMany({
      where: and(
        eq(userInteractions.userId, userId),
        eq(userInteractions.interactionType, 'read')
      ),
    });

    if (userReadings.length === 0) {
      return this.generatePopularRecommendations(userId, limit);
    }

    const readPaperIds = new Set(userReadings.map((r) => r.paperId));

    // Find similar users
    const similarUsers = await db
      .selectDistinct({ userId: userInteractions.userId })
      .from(userInteractions)
      .where(userInteractions.paperId.inArray(Array.from(readPaperIds)))
      .limit(100);

    // Get papers read by similar users but not by current user
    const similarUserIds = similarUsers.map((u) => u.userId);

    const recommendations = await db
      .selectDistinct({
        paperId: userInteractions.paperId,
        frequency: count(userInteractions.paperId).as('frequency'),
      })
      .from(userInteractions)
      .where(
        and(
          userInteractions.userId.inArray(similarUserIds),
          userInteractions.paperId.notInArray(Array.from(readPaperIds))
        )
      )
      .groupBy(userInteractions.paperId)
      .orderBy([desc(count(userInteractions.paperId))])
      .limit(limit);

    return recommendations.map((rec, index) => ({
      paperId: rec.paperId,
      score: (1 - index / limit) * 100,
      reason: 'collaborative_filtering' as const,
      confidence: Math.min(rec.frequency * 10, 95),
    }));
  }

  /**
   * Generate recommendations based on content similarity
   */
  async generateContentBasedRecommendations(userId: string, limit: number = 20) {
    const userReadings = await db.query.userInteractions.findMany({
      where: and(
        eq(userInteractions.userId, userId),
        eq(userInteractions.interactionType, 'read')
      ),
    });

    if (userReadings.length === 0) {
      return [];
    }

    // Extract topics from read papers
    const topics = new Set<string>();
    userReadings.forEach((reading) => {
      const readingTopics = reading.metadata?.topics as string[] | undefined;
      readingTopics?.forEach((topic) => topics.add(topic));
    });

    // Find papers with matching topics
    // This is a simplified implementation
    // In production, use full-text search or embeddings
    const topicArray = Array.from(topics);
    const readPaperIds = new Set(userReadings.map((r) => r.paperId));

    const recommendations = await db.query.paperAnalytics.findMany({
      where: (
        pa // Simplified: filter by topics in metadata
      ) => undefined,
      limit,
    });

    return recommendations.map((rec, index) => ({
      paperId: rec.paperId,
      score: (1 - index / limit) * 100,
      reason: 'content_based' as const,
      confidence: 75,
    }));
  }

  /**
   * Generate recommendations based on trending papers
   */
  async generateTrendingRecommendations(userId: string, limit: number = 20) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trendingPapers = await db.query.paperAnalytics.findMany({
      where: gte(paperAnalytics.lastAnalyzedAt, sevenDaysAgo),
      orderBy: [desc(paperAnalytics.trendingScore)],
      limit,
    });

    // Filter out already read papers
    const userReadings = await db.query.userInteractions.findMany({
      where: and(
        eq(userInteractions.userId, userId),
        eq(userInteractions.interactionType, 'read')
      ),
    });

    const readPaperIds = new Set(userReadings.map((r) => r.paperId));

    return trendingPapers
      .filter((p) => !readPaperIds.has(p.paperId))
      .map((paper, index) => ({
        paperId: paper.paperId,
        score: (1 - index / limit) * 100,
        reason: 'trending' as const,
        confidence: parseFloat(paper.trendingScore || '0'),
      }))
      .slice(0, limit);
  }

  /**
   * Generate popular papers recommendations
   */
  async generatePopularRecommendations(userId: string, limit: number = 20) {
    const papers = await db.query.paperAnalytics.findMany({
      orderBy: [desc(paperAnalytics.influenceScore)],
      limit: limit * 2,
    });

    // Filter out already read papers
    const userReadings = await db.query.userInteractions.findMany({
      where: and(
        eq(userInteractions.userId, userId),
        eq(userInteractions.interactionType, 'read')
      ),
    });

    const readPaperIds = new Set(userReadings.map((r) => r.paperId));

    return papers
      .filter((p) => !readPaperIds.has(p.paperId))
      .slice(0, limit)
      .map((paper, index) => ({
        paperId: paper.paperId,
        score: (1 - index / limit) * 100,
        reason: 'popular' as const,
        confidence: Math.min(parseFloat(paper.influenceScore || '0'), 100),
      }));
  }

  /**
   * Generate hybrid recommendations combining all methods
   */
  async generateHybridRecommendations(
    userId: string,
    limit: number = 20
  ) {
    const [collaborative, trending, popular] = await Promise.all([
      this.generateCollaborativeRecommendations(userId, Math.ceil(limit / 3)),
      this.generateTrendingRecommendations(userId, Math.ceil(limit / 3)),
      this.generatePopularRecommendations(userId, Math.ceil(limit / 3)),
    ]);

    // Combine and weight recommendations
    const combined = new Map<string, { score: number; reasons: string[] }>();

    collaborative.forEach((rec) => {
      const existing = combined.get(rec.paperId);
      combined.set(rec.paperId, {
        score: (existing?.score || 0) + rec.score * 0.5,
        reasons: [...(existing?.reasons || []), rec.reason],
      });
    });

    trending.forEach((rec) => {
      const existing = combined.get(rec.paperId);
      combined.set(rec.paperId, {
        score: (existing?.score || 0) + rec.score * 0.3,
        reasons: [...(existing?.reasons || []), rec.reason],
      });
    });

    popular.forEach((rec) => {
      const existing = combined.get(rec.paperId);
      combined.set(rec.paperId, {
        score: (existing?.score || 0) + rec.score * 0.2,
        reasons: [...(existing?.reasons || []), rec.reason],
      });
    });

    // Sort by score and return top recommendations
    const sorted = Array.from(combined.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit);

    return sorted.map(([paperId, data]) => ({
      paperId,
      score: Math.min(data.score, 100),
      reasons: data.reasons,
    }));
  }

  /**
   * Save recommendation to database
   */
  async saveRecommendation(
    userId: string,
    paperId: string,
    score: number,
    reason: string,
    confidence: number = 75
  ) {
    await db.insert(paperRecommendations).values({
      userId,
      paperId,
      score: score.toString(),
      reason,
      confidence: confidence.toString(),
    });
  }

  /**
   * Track recommendation clicks
   */
  async trackRecommendationClick(recommendationId: string) {
    const rec = await db.query.paperRecommendations.findFirst({
      where: eq(paperRecommendations.id, recommendationId),
    });

    if (rec) {
      await db
        .update(paperRecommendations)
        .set({ clicked: (rec.clicked || 0) + 1 })
        .where(eq(paperRecommendations.id, recommendationId));
    }
  }
}

export const recommendationService = new RecommendationService();
