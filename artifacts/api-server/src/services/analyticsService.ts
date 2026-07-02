import { db } from '@workspace/db';
import { paperAnalytics, userReadingPatterns, paperTrends } from '@workspace/db/schema';
import { eq, and, desc, gte, avg, count } from 'drizzle-orm';

interface PaperAnalyticsData {
  paperId: string;
  citationCount: number;
  readCount: number;
  trendingScore: number;
}

interface UserReadingData {
  userId: string;
  totalPapersRead: number;
  averageReadTime: number;
  preferredTopics: string[];
  engagementLevel: 'high' | 'medium' | 'low';
}

export class AnalyticsService {
  async getPaperAnalytics(paperId: string, userId: string) {
    const analytics = await db.query.paperAnalytics.findFirst({
      where: and(
        eq(paperAnalytics.paperId, paperId),
        eq(paperAnalytics.userId, userId)
      ),
    });

    if (!analytics) {
      return this.initializePaperAnalytics(paperId, userId);
    }

    return analytics;
  }

  async initializePaperAnalytics(paperId: string, userId: string) {
    const [analytics] = await db
      .insert(paperAnalytics)
      .values({
        paperId,
        userId,
        citationCount: 0,
        readCount: 0,
        influenceScore: '0',
        trendingScore: '0',
        impactCategory: 'low',
      })
      .returning();

    return analytics;
  }

  async calculateInfluenceScore(paperId: string): Promise<number> {
    const analytics = await db.query.paperAnalytics.findFirst({
      where: eq(paperAnalytics.paperId, paperId),
    });

    if (!analytics) return 0;

    // Influence Score = (citations * 0.6) + (reads * 0.3) + (trending * 0.1)
    const influenceScore =
      analytics.citationCount * 0.6 +
      analytics.readCount * 0.3 +
      (parseFloat(analytics.trendingScore || '0') * 0.1);

    // Determine impact category
    let impactCategory: 'high' | 'medium' | 'low' = 'low';
    if (influenceScore > 100) impactCategory = 'high';
    else if (influenceScore > 50) impactCategory = 'medium';

    // Update analytics
    await db
      .update(paperAnalytics)
      .set({
        influenceScore: influenceScore.toString(),
        impactCategory,
        lastAnalyzedAt: new Date(),
      })
      .where(eq(paperAnalytics.paperId, paperId));

    return influenceScore;
  }

  async updateReadingPattern(userId: string, topicsTouched: string[]) {
    const existing = await db.query.userReadingPatterns.findFirst({
      where: eq(userReadingPatterns.userId, userId),
    });

    const preferredTopics = existing?.preferredTopics || [];
    const updatedTopics = [
      ...new Set([...preferredTopics, ...topicsTouched]),
    ].slice(-20); // Keep last 20 topics

    if (existing) {
      await db
        .update(userReadingPatterns)
        .set({
          totalPapersRead: existing.totalPapersRead + 1,
          preferredTopics: updatedTopics,
          lastReadAt: new Date(),
        })
        .where(eq(userReadingPatterns.userId, userId));
    } else {
      await db.insert(userReadingPatterns).values({
        userId,
        totalPapersRead: 1,
        preferredTopics: updatedTopics,
        engagementLevel: 'low',
        lastReadAt: new Date(),
      });
    }
  }

  async getTrendingTopics(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await db.query.paperTrends.findMany({
      where: and(
        gte(paperTrends.updatedAt, since),
        eq(paperTrends.trendDirection, 'rising')
      ),
      orderBy: [desc(paperTrends.momentum)],
      limit: 20,
    });

    return trends;
  }

  async getUserDashboard(userId: string) {
    const readingPattern = await db.query.userReadingPatterns.findFirst({
      where: eq(userReadingPatterns.userId, userId),
    });

    const recentReadings = await db.query.userInteractions.findMany({
      where: eq(userInteractions.userId, userId),
      orderBy: [desc(userInteractions.createdAt)],
      limit: 50,
    });

    const topicStats = (readingPattern?.preferredTopics || []).map((topic) => ({
      topic,
      count: recentReadings.filter((r) =>
        r.metadata?.topics?.includes(topic)
      ).length,
    }));

    return {
      totalPapersRead: readingPattern?.totalPapersRead || 0,
      averageReadTime: readingPattern?.averageReadTime || 0,
      engagementLevel: readingPattern?.engagementLevel || 'low',
      preferredTopics: readingPattern?.preferredTopics || [],
      readingStreak: readingPattern?.readingStreak || 0,
      topicStats,
      recentActivity: recentReadings.slice(0, 10),
    };
  }
}

export const analyticsService = new AnalyticsService();
