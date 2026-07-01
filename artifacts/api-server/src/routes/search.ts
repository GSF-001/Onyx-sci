import { Router } from "express";
import { chatCompletion } from "../lib/groq";
import { XMLParser } from "fast-xml-parser";

const router = Router();
const ARXIV_BASE = "https://export.arxiv.org/api/query";
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => name === "entry" || name === "author" || name === "link" || name === "category",
});

const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 1;
const MAX_LIMIT = 20;
const ARXIV_TIMEOUT_MS = 12000;
const SUGGESTIONS_TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;
const MAX_TRENDING_ENTRIES = 500;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 300;

interface ArxivEntry {
  id: string;
  title: string;
  summary: string;
  author: { name: string }[] | { name: string };
  published: string;
  updated: string;
  link: { "@_href": string; "@_rel": string; "@_title"?: string; "@_type"?: string }[];
  category: { "@_term": string; "@_scheme": string }[] | { "@_term": string; "@_scheme": string };
  "arxiv:doi"?: string;
  "arxiv:journal_ref"?: string;
  "arxiv:comment"?: string;
}

interface FormattedPaper {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  abstract: string;
  journal: string | null;
  doi: string | null;
  arxivId: string;
  categories: string[];
  primaryCategory: string | null;
  comment: string | null;
  citationCount: number;
  isOpenAccess: boolean;
  url: string;
  pdfUrl: string;
  noveltyScore: number | null;
  relevanceScore: number | null;
  publishedDate: string | null;
  updatedDate: string | null;
}

// ---------- low-level helpers ----------

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with automatic retry + exponential backoff on transient failures
 * (network errors, 429 rate limit, 5xx). Non-retryable client errors (4xx
 * other than 429) are returned as-is so the caller can surface them properly.
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  let lastErr: unknown;
  let lastRes: Response | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      lastRes = res;
      if (res.status !== 429 && res.status < 500) {
        return res;
      }
    } catch (err) {
      lastErr = err;
    }
    if (attempt < retries) {
      const delay = RETRY_BASE_DELAY_MS * 2 ** attempt + Math.random() * 100;
      await sleep(delay);
    }
  }

  if (lastRes) return lastRes;
  throw lastErr instanceof Error ? lastErr : new Error("ArXiv request failed");
}

/** Only allow arXiv-style category codes like "cs.AI", "cond-mat.stat-mech". */
function sanitizeCategory(category: string): string | null {
  const trimmed = category.trim();
  return /^[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z]{2,6})?$/.test(trimmed) ? trimmed : null;
}

/**
 * Builds a properly structured & encoded arXiv search_query string.
 * Each field is encoded independently, then joined — this is the fix for
 * the old bug where the whole "cat:X AND all:Y" string got wrapped and
 * re-encoded as a single "all:" clause, silently breaking category filters.
 */
function buildSearchQuery(query: string, category?: string): string {
  const encodedQuery = encodeURIComponent(query.trim());
  const safeCategory = category ? sanitizeCategory(category) : null;
  if (safeCategory) {
    return `cat:${encodeURIComponent(safeCategory)}+AND+all:${encodedQuery}`;
  }
  return `all:${encodedQuery}`;
}

function clampLimit(limit: unknown): number {
  const n = typeof limit === "number" ? limit : parseInt(String(limit), 10);
  if (!Number.isFinite(n)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(n), MIN_LIMIT), MAX_LIMIT);
}

function clampOffset(offset: unknown): number {
  const n = typeof offset === "number" ? offset : parseInt(String(offset), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.trunc(n);
}

async function searchArxiv(searchQuery: string, limit: number, offset: number): Promise<{ total: number; entries: ArxivEntry[] }> {
  const url = `${ARXIV_BASE}?search_query=${searchQuery}&start=${offset}&max_results=${limit}&sortBy=relevance&sortOrder=descending`;
  const res = await fetchWithRetry(url, {
    headers: { Accept: "application/atom+xml" },
    signal: AbortSignal.timeout(ARXIV_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`ArXiv API error: ${res.status}`);

  const text = await res.text();
  const parsed = xmlParser.parse(text);
  const feed = parsed?.feed;
  const totalStr = feed?.["opensearch:totalResults"];
  const total = typeof totalStr === "number" ? totalStr : parseInt(String(totalStr ?? "0"), 10) || 0;
  const entries: ArxivEntry[] = Array.isArray(feed?.entry) ? feed.entry : feed?.entry ? [feed.entry] : [];
  return { total, entries };
}

function extractArxivId(idUrl: string): string {
  const stripped = idUrl.replace(/^https?:\/\/arxiv\.org\/abs\//, "");
  return stripped.replace(/v\d+$/, "");
}

function formatArxivEntry(e: ArxivEntry, index: number): FormattedPaper {
  const rawId = typeof e.id === "string" ? e.id.trim() : `arxiv_${index}`;
  const arxivId = extractArxivId(rawId);
  const absUrl = `https://arxiv.org/abs/${arxivId}`;
  const pdfUrl = `https://arxiv.org/pdf/${arxivId}`;

  const authors = Array.isArray(e.author)
    ? e.author.map((a) => a.name).filter(Boolean)
    : e.author
    ? [e.author.name]
    : [];

  const publishedYear = e.published ? new Date(e.published).getFullYear() : null;
  const categories = Array.isArray(e.category)
    ? e.category.map((c) => c["@_term"]).filter(Boolean)
    : e.category
    ? [e.category["@_term"]]
    : [];

  const primaryCategory = categories[0] ?? null;
  const journal = e["arxiv:journal_ref"] ?? null;
  const doi = e["arxiv:doi"] ?? null;
  const comment = e["arxiv:comment"] ?? null;

  const title = typeof e.title === "string" ? e.title.replace(/\s+/g, " ").trim() : "Untitled";
  const abstract = typeof e.summary === "string" ? e.summary.replace(/\s+/g, " ").trim() : "";

  return {
    id: arxivId || `arxiv_${index}`,
    title,
    authors,
    year: publishedYear,
    abstract,
    journal,
    doi,
    arxivId,
    categories,
    primaryCategory,
    comment,
    citationCount: 0,
    isOpenAccess: true,
    url: absUrl,
    pdfUrl,
    noveltyScore: null,
    relevanceScore: null,
    publishedDate: e.published ?? null,
    updatedDate: e.updated ?? null,
  };
}

// ---------- search result cache ----------

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}
const searchCache = new Map<string, CacheEntry>();

function buildCacheKey(query: string, limit: number, offset: number, filters: Record<string, unknown>): string {
  return JSON.stringify({ q: query.toLowerCase(), limit, offset, filters });
}

function getCached(key: string): unknown | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    searchCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: unknown): void {
  if (searchCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  searchCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ---------- trending tracker (real usage, not hardcoded) ----------
// NOTE: in-memory and per-process. For a multi-instance deployment this
// should move to a shared store (Redis/DB) so counts aren't split per pod.

interface TrendingEntry {
  query: string;
  count: number;
  field: string | null;
  lastSeen: number;
}
const trendingMap = new Map<string, TrendingEntry>();

const CATEGORY_FIELD_MAP: Record<string, string> = {
  "cs.ai": "Kecerdasan Buatan",
  "cs.lg": "Pembelajaran Mesin",
  "cs.cl": "NLP",
  "cs.cv": "Visi Komputer",
  "cs.ne": "Jaringan Saraf Tiruan",
  "stat.ml": "Pembelajaran Mesin",
  "q-bio": "Biologi Komputasi",
  "quant-ph": "Fisika Kuantum",
  math: "Matematika",
  physics: "Fisika",
  eess: "Teknik Elektro",
  "cond-mat": "Fisika Materi Terkondensasi",
};

function mapCategoryToField(category?: string | null): string | null {
  if (!category) return null;
  const key = category.toLowerCase();
  if (CATEGORY_FIELD_MAP[key]) return CATEGORY_FIELD_MAP[key];
  const prefix = key.split(".")[0];
  return CATEGORY_FIELD_MAP[prefix] ?? category;
}

function recordSearch(query: string, category?: string | null): void {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return;

  const existing = trendingMap.get(normalized);
  const field = mapCategoryToField(category) ?? existing?.field ?? null;

  if (existing) {
    existing.count += 1;
    existing.lastSeen = Date.now();
    existing.field = field;
    return;
  }

  if (trendingMap.size >= MAX_TRENDING_ENTRIES) {
    let oldestKey: string | null = null;
    let oldestTs = Infinity;
    for (const [k, v] of trendingMap) {
      if (v.lastSeen < oldestTs) {
        oldestTs = v.lastSeen;
        oldestKey = k;
      }
    }
    if (oldestKey) trendingMap.delete(oldestKey);
  }

  trendingMap.set(normalized, { query: query.trim(), count: 1, field, lastSeen: Date.now() });
}

function getTrending(limit: number): { query: string; count: number; field: string | null }[] {
  return Array.from(trendingMap.values())
    .sort((a, b) => b.count - a.count || b.lastSeen - a.lastSeen)
    .slice(0, limit)
    .map(({ query, count, field }) => ({ query, count, field }));
}

// ---------- routes ----------

router.post("/", async (req, res) => {
  const body = req.body as {
    query?: string;
    limit?: number;
    offset?: number;
    filters?: { yearFrom?: number; yearTo?: number; openAccess?: boolean; category?: string };
  };

  const query = body.query?.trim();
  if (!query) {
    return res.status(400).json({ error: "Query diperlukan" });
  }

  const limit = clampLimit(body.limit);
  const offset = clampOffset(body.offset);
  const filters = body.filters ?? {};

  const cacheKey = buildCacheKey(query, limit, offset, filters);
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const searchQuery = buildSearchQuery(query, filters.category);
    const arxivData = await searchArxiv(searchQuery, limit, offset);
    let papers = arxivData.entries.map(formatArxivEntry);

    if (filters.yearFrom != null) papers = papers.filter((p) => p.year == null || p.year >= filters.yearFrom!);
    if (filters.yearTo != null) papers = papers.filter((p) => p.year == null || p.year <= filters.yearTo!);
    if (filters.openAccess) papers = papers.filter((p) => p.isOpenAccess);

    let aiSummary: string | null = null;
    try {
      const titlesSnippet = papers.slice(0, 5).map((p) => p.title).join("; ");
      if (titlesSnippet) {
        const summaryRes = await chatCompletion(
          [
            {
              role: "user",
              content: `Dalam 2-3 kalimat bahasa Indonesia, rangkum lanskap penelitian untuk kueri "${query}" berdasarkan makalah-makalah ini dari ArXiv: ${titlesSnippet}. Jadilah ringkas dan ilmiah.`,
            },
          ],
          { temperature: 0.5, maxTokens: 200 }
        );
        aiSummary = summaryRes.trim();
      }
    } catch (summaryErr) {
      req.log.warn({ err: summaryErr }, "AI summary generation failed, continuing without it");
    }

    const responseBody = { papers, total: arxivData.total, query, aiSummary };
    setCached(cacheKey, responseBody);
    recordSearch(query, papers[0]?.primaryCategory ?? filters.category);

    res.json(responseBody);
  } catch (err) {
    req.log.error({ err }, "ArXiv search failed");
    res.status(500).json({ error: "Pencarian gagal. Silakan coba lagi." });
  }
});

router.get("/trending", async (req, res) => {
  const limitParam = parseInt(String(req.query.limit ?? "10"), 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 10;
  res.json(getTrending(limit));
});

router.get("/suggestions", async (req, res) => {
  const q = (req.query.q as string)?.trim();
  if (!q || q.length < 2) return res.json([]);

  const qLower = q.toLowerCase();

  // 1) Real usage data first: trending queries that start with this prefix
  const trendingMatches = Array.from(trendingMap.values())
    .filter((t) => t.query.toLowerCase().startsWith(qLower))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((t) => t.query);

  if (trendingMatches.length >= 5) {
    return res.json(trendingMatches);
  }

  // 2) Live suggestions pulled from real ArXiv titles
  try {
    const searchQuery = buildSearchQuery(q);
    const url = `${ARXIV_BASE}?search_query=${searchQuery}&start=0&max_results=5`;
    const r = await fetchWithRetry(
      url,
      { headers: { Accept: "application/atom+xml" }, signal: AbortSignal.timeout(SUGGESTIONS_TIMEOUT_MS) },
      1
    );
    if (r.ok) {
      const text = await r.text();
      const parsed = xmlParser.parse(text);
      const entries = parsed?.feed?.entry;
      const arr: ArxivEntry[] = Array.isArray(entries) ? entries : entries ? [entries] : [];
      const titles = arr
        .map((e) => (typeof e.title === "string" ? e.title.replace(/\s+/g, " ").trim() : ""))
        .filter(Boolean);
      const merged = Array.from(new Set([...trendingMatches, ...titles])).slice(0, 5);
      if (merged.length > 0) return res.json(merged);
    }
  } catch (err) {
    req.log.warn({ err }, "ArXiv suggestions lookup failed, falling back to heuristic suggestions");
  }

  // 3) Last resort only: used when ArXiv is unreachable AND there's no usage data yet
  const fallback = [`${q} deep learning`, `${q} neural network`, `${q} transformer`, `${q} review 2024`, `${q} survey`];
  res.json(Array.from(new Set([...trendingMatches, ...fallback])).slice(0, 5));
});

export default router;
