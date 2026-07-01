import { Router } from "express";
import { chatCompletion } from "../lib/groq";
import { db } from "@workspace/db";
import { papersTable } from "@workspace/db";

const router = Router();

const RECENT_WINDOW_YEARS = 1; // papers from currentYear-RECENT_WINDOW_YEARS..currentYear = "recent"
const BASELINE_FROM_OFFSET = 3; // baseline window: currentYear-3..currentYear-2
const BASELINE_TO_OFFSET = 2;
const TIMESERIES_SPAN_YEARS = 6;
const MAX_YEARS_BACK = 15;
const OVERVIEW_CACHE_TTL_MS = 10 * 60 * 1000;

function currentYear(): number {
  return new Date().getFullYear();
}

interface PaperStatRow {
  field: string | null;
  keywords: unknown;
  year: number | null;
  noveltyScore: number | null;
}

interface FieldStat {
  name: string;
  paperCount: number;
  noveltyScore: number;
  growthRate: number | null;
}

interface TopicStat {
  name: string;
  field: string | null;
  paperCount: number;
  growth: number | null;
  description: string;
}

interface OverviewPayload {
  risingTopics: TopicStat[];
  emergingMethods: string[];
  trendingFields: FieldStat[];
  timeseriesData: Array<{ year: number; value: number }>;
  aiInsight: string;
}

let overviewCache: { data: OverviewPayload; expiresAt: number } | null = null;

async function loadPaperStats(): Promise<PaperStatRow[]> {
  return db
    .select({
      field: papersTable.field,
      keywords: papersTable.keywords,
      year: papersTable.year,
      noveltyScore: papersTable.noveltyScore,
    })
    .from(papersTable);
}

function normalizeKeywords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((k): k is string => typeof k === "string" && k.trim().length > 0);
}

/**
 * Growth is only reported when we actually have a baseline period to compare
 * against. Without a baseline we return null (unknown) instead of inventing
 * a percentage — an honest "not enough data" beats a plausible-looking lie.
 */
function computeGrowthRate(recentCount: number, baselineCount: number): number | null {
  if (baselineCount === 0) return null;
  return Math.round(((recentCount - baselineCount) / baselineCount) * 1000) / 10;
}

function computeFieldStats(rows: PaperStatRow[]): FieldStat[] {
  const year = currentYear();
  const byField = new Map<string, { count: number; noveltySum: number; noveltyN: number; recent: number; baseline: number }>();

  for (const row of rows) {
    if (!row.field) continue;
    const entry = byField.get(row.field) ?? { count: 0, noveltySum: 0, noveltyN: 0, recent: 0, baseline: 0 };
    entry.count += 1;
    if (typeof row.noveltyScore === "number") {
      entry.noveltySum += row.noveltyScore;
      entry.noveltyN += 1;
    }
    if (row.year != null) {
      if (row.year >= year - RECENT_WINDOW_YEARS) entry.recent += 1;
      else if (row.year >= year - BASELINE_FROM_OFFSET && row.year <= year - BASELINE_TO_OFFSET) entry.baseline += 1;
    }
    byField.set(row.field, entry);
  }

  return Array.from(byField.entries())
    .map(([name, s]) => ({
      name,
      paperCount: s.count,
      noveltyScore: s.noveltyN > 0 ? Math.round((s.noveltySum / s.noveltyN) * 10) / 10 : 0,
      growthRate: computeGrowthRate(s.recent, s.baseline),
    }))
    .sort((a, b) => b.paperCount - a.paperCount);
}

function computeTopicStats(rows: PaperStatRow[]): TopicStat[] {
  const year = currentYear();
  const byKeyword = new Map<string, { count: number; recent: number; baseline: number; fields: Map<string, number> }>();

  for (const row of rows) {
    for (const kw of normalizeKeywords(row.keywords)) {
      const key = kw.trim();
      if (!key) continue;
      const entry = byKeyword.get(key) ?? { count: 0, recent: 0, baseline: 0, fields: new Map<string, number>() };
      entry.count += 1;
      if (row.year != null) {
        if (row.year >= year - RECENT_WINDOW_YEARS) entry.recent += 1;
        else if (row.year >= year - BASELINE_FROM_OFFSET && row.year <= year - BASELINE_TO_OFFSET) entry.baseline += 1;
      }
      if (row.field) entry.fields.set(row.field, (entry.fields.get(row.field) ?? 0) + 1);
      byKeyword.set(key, entry);
    }
  }

  return Array.from(byKeyword.entries())
    .map(([name, s]) => {
      const dominantField = Array.from(s.fields.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        name,
        field: dominantField,
        paperCount: s.count,
        growth: computeGrowthRate(s.recent, s.baseline),
        description: `Muncul di ${s.count} makalah tersimpan${dominantField ? ` di bidang ${dominantField}` : ""}.`,
      };
    })
    .sort((a, b) => b.paperCount - a.paperCount);
}

function computeTimeseries(rows: PaperStatRow[]): Array<{ year: number; value: number }> {
  const year = currentYear();
  const years = Array.from({ length: TIMESERIES_SPAN_YEARS }, (_, i) => year - TIMESERIES_SPAN_YEARS + 1 + i);
  const counts = new Map<number, number>(years.map((y) => [y, 0]));
  for (const row of rows) {
    if (row.year != null && counts.has(row.year)) {
      counts.set(row.year, (counts.get(row.year) ?? 0) + 1);
    }
  }
  return years.map((y) => ({ year: y, value: counts.get(y) ?? 0 }));
}

function applyFieldFilter(payload: OverviewPayload, field?: string): OverviewPayload {
  if (!field) return payload;
  const fieldLower = field.toLowerCase();
  return {
    ...payload,
    trendingFields: payload.trendingFields.filter((f) => f.name.toLowerCase().includes(fieldLower)),
    risingTopics: payload.risingTopics.filter((t) => (t.field ?? "").toLowerCase().includes(fieldLower)),
  };
}

async function buildOverviewPayload(req: Parameters<Parameters<Router["get"]>[1]>[0]): Promise<OverviewPayload> {
  const rows = await loadPaperStats();
  const trendingFields = computeFieldStats(rows).slice(0, 8);
  const risingTopics = computeTopicStats(rows).slice(0, 10);
  const timeseriesData = computeTimeseries(rows);
  const emergingMethods = risingTopics.slice(0, 8).map((t) => t.name);

  let aiInsight =
    "Belum ada cukup makalah tersimpan untuk menghasilkan insight tren yang bermakna. Simpan beberapa makalah dulu untuk mulai melihat analisis tren.";

  if (rows.length > 0) {
    try {
      const summaryInput = trendingFields
        .slice(0, 5)
        .map((f) => `${f.name} (${f.paperCount} makalah)`)
        .join(", ");
      const aiRes = await chatCompletion(
        [
          {
            role: "user",
            content: `Berdasarkan data riset tersimpan berikut: ${summaryInput}. Tulis 2 kalimat insight dalam bahasa Indonesia tentang tren riset yang terlihat dari data ini. Gunakan hanya angka yang diberikan, jangan mengarang data baru.`,
          },
        ],
        { temperature: 0.4, maxTokens: 150 }
      );
      aiInsight = aiRes.trim();
    } catch (aiErr) {
      req.log.warn({ err: aiErr }, "AI insight generation failed, using computed fallback insight");
      aiInsight = `Data tersimpan mencakup ${rows.length} makalah di ${trendingFields.length} bidang, dengan "${trendingFields[0]?.name ?? "belum ada bidang dominan"}" sebagai yang terbanyak.`;
    }
  }

  return { risingTopics, emergingMethods, trendingFields, timeseriesData, aiInsight };
}

// Trends overview — now backed by the actual saved-papers corpus instead of
// static/random numbers. Filtering by `field` genuinely narrows the result
// (previously it only changed the insight text).
router.get("/overview", async (req, res) => {
  const field = (req.query.field as string | undefined)?.trim();

  try {
    let payload: OverviewPayload;
    if (overviewCache && overviewCache.expiresAt > Date.now()) {
      payload = overviewCache.data;
    } else {
      payload = await buildOverviewPayload(req);
      overviewCache = { data: payload, expiresAt: Date.now() + OVERVIEW_CACHE_TTL_MS };
    }
    res.json(applyFieldFilter(payload, field));
  } catch (err) {
    req.log.error({ err }, "Trends overview failed");
    res.status(500).json({ error: "Failed to load trends overview" });
  }
});

// Analyze trends for a specific topic
router.post("/analyze", async (req, res) => {
  const { topic, yearsBack = 5 } = req.body as { topic?: string; yearsBack?: number };

  if (!topic?.trim()) {
    return res.status(400).json({ error: "Topic diperlukan" });
  }

  try {
    const prompt = `Analyze research trends for the topic: "${topic}".

Respond in this exact JSON format:
{
  "noveltyScore": 8.2,
  "velocityScore": 7.5,
  "insights": "2-3 sentence analysis of where this research area is headed",
  "predictedGrowth": "High growth expected in 2025-2026 driven by...",
  "keyPapers": [
    {
      "id": "p1",
      "title": "Key paper title",
      "authors": ["Author One"],
      "year": 2023,
      "abstract": "Brief abstract",
      "journal": "Nature",
      "citationCount": 234,
      "isOpenAccess": true,
      "keywords": ["keyword"],
      "noveltyScore": 8.9,
      "relevanceScore": 9.5
    }
  ]
}

noveltyScore and velocityScore are 0-10. Generate 3-5 key papers. Return ONLY valid JSON.`;

    const response = await chatCompletion([{ role: "user", content: prompt }], {
      temperature: 0.5,
      maxTokens: 2000,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse");
    const parsed = JSON.parse(jsonMatch[0]);

    // Fixed: baseYear used to be hardcoded off "2024", which silently drifts
    // wrong every year that passes. Always derive from the real clock.
    const span = Math.max(1, Math.min(Math.trunc(yearsBack) || 5, MAX_YEARS_BACK));
    const baseYear = currentYear() - span;
    const years = Array.from({ length: span + 1 }, (_, i) => baseYear + i);

    // Prefer real counts from our own saved corpus when we have matching
    // papers. If nothing matches, report null values instead of the old
    // Math.random()-based synthetic noise — an honest "no data" beats a
    // fabricated-looking chart.
    const rows = await loadPaperStats();
    const topicLower = topic.trim().toLowerCase();
    const matching = rows.filter(
      (r) =>
        (r.field?.toLowerCase().includes(topicLower) ?? false) ||
        normalizeKeywords(r.keywords).some((k) => k.toLowerCase().includes(topicLower))
    );

    const counts = new Map<number, number>(years.map((y) => [y, 0]));
    for (const r of matching) {
      if (r.year != null && counts.has(r.year)) counts.set(r.year, (counts.get(r.year) ?? 0) + 1);
    }

    const hasRealData = matching.length > 0;
    const timeseriesData = years.map((y) => ({ year: y, value: hasRealData ? counts.get(y) ?? 0 : null }));

    res.json({
      topic,
      noveltyScore: parsed.noveltyScore,
      velocityScore: parsed.velocityScore,
      timeseriesData,
      timeseriesSource: hasRealData ? "corpus" : "unavailable",
      keyPapers: (parsed.keyPapers ?? []).map((p: Record<string, unknown>) => ({ ...p, field: topic })),
      insights: parsed.insights,
      predictedGrowth: parsed.predictedGrowth,
    });
  } catch (err) {
    req.log.error({ err }, "Trend analysis failed");
    res.status(500).json({ error: "Failed to analyze trends" });
  }
});

// Get rising topics — same real corpus-backed computation as /overview.
router.get("/rising", async (req, res) => {
  try {
    const rows = await loadPaperStats();
    res.json(computeTopicStats(rows).slice(0, 10));
  } catch (err) {
    req.log.error({ err }, "Get rising topics failed");
    res.status(500).json({ error: "Failed to get rising topics" });
  }
});

export default router;
