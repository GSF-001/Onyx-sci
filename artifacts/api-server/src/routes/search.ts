import { Router } from "express";
import { chatCompletion } from "../lib/groq";
import { XMLParser } from "fast-xml-parser";

const router = Router();
const ARXIV_BASE = "https://export.arxiv.org/api/query";
const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", isArray: (name) => name === "entry" || name === "author" || name === "link" || name === "category" });

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

async function searchArxiv(query: string, limit = 10, offset = 0): Promise<{ total: number; entries: ArxivEntry[] }> {
  const searchQuery = `all:${encodeURIComponent(query)}`;
  const url = `${ARXIV_BASE}?search_query=${searchQuery}&start=${offset}&max_results=${limit}&sortBy=relevance&sortOrder=descending`;
  const res = await fetch(url, {
    headers: { "Accept": "application/atom+xml" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`ArXiv API error: ${res.status}`);
  const text = await res.text();
  const parsed = xmlParser.parse(text);
  const feed = parsed?.feed;
  const totalStr = feed?.["opensearch:totalResults"];
  const total = typeof totalStr === "number" ? totalStr : parseInt(String(totalStr ?? "0"), 10);
  const entries: ArxivEntry[] = Array.isArray(feed?.entry) ? feed.entry : feed?.entry ? [feed.entry] : [];
  return { total, entries };
}

function extractArxivId(idUrl: string): string {
  return idUrl.replace("http://arxiv.org/abs/", "").replace("https://arxiv.org/abs/", "").split("v")[0];
}

function formatArxivEntry(e: ArxivEntry, index: number) {
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

router.post("/", async (req, res) => {
  const { query, limit = 10, offset = 0, filters } = req.body as {
    query: string;
    limit?: number;
    offset?: number;
    filters?: { yearFrom?: number; yearTo?: number; openAccess?: boolean; category?: string };
  };

  if (!query?.trim()) {
    return res.status(400).json({ error: "Query diperlukan" });
  }

  try {
    let arxivQuery = query;
    if (filters?.category) {
      arxivQuery = `cat:${filters.category} AND all:${query}`;
    }

    const arxivData = await searchArxiv(arxivQuery, Math.min(limit, 20), offset);
    let papers = arxivData.entries.map(formatArxivEntry);

    if (filters?.yearFrom) papers = papers.filter((p) => p.year == null || p.year >= filters.yearFrom!);
    if (filters?.yearTo) papers = papers.filter((p) => p.year == null || p.year <= filters.yearTo!);

    let aiSummary: string | null = null;
    try {
      const titlesSnippet = papers.slice(0, 5).map((p) => p.title).join("; ");
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
    } catch {
      // Summary is optional
    }

    res.json({ papers, total: arxivData.total, query, aiSummary });
  } catch (err) {
    req.log.error({ err }, "ArXiv search failed");
    res.status(500).json({ error: "Pencarian gagal. Silakan coba lagi." });
  }
});

router.get("/trending", async (_req, res) => {
  res.json([
    { query: "large language model reasoning", count: 3412, field: "Kecerdasan Buatan" },
    { query: "diffusion models image generation", count: 2876, field: "Pembelajaran Mesin" },
    { query: "protein structure prediction AlphaFold", count: 1987, field: "Biologi Komputasi" },
    { query: "quantum error correction", count: 1654, field: "Fisika Kuantum" },
    { query: "reinforcement learning from human feedback", count: 1543, field: "Pembelajaran Mesin" },
    { query: "multimodal foundation models", count: 1421, field: "Visi Komputer" },
    { query: "graph neural networks drug discovery", count: 1234, field: "Bioinformatika" },
    { query: "climate change machine learning", count: 987, field: "Ilmu Lingkungan" },
    { query: "transformer architecture efficient attention", count: 876, field: "NLP" },
    { query: "single cell RNA sequencing analysis", count: 765, field: "Genomika" },
  ]);
});

router.get("/suggestions", async (req, res) => {
  const q = req.query.q as string;
  if (!q || q.length < 2) return res.json([]);
  try {
    const url = `${ARXIV_BASE}?search_query=all:${encodeURIComponent(q)}&start=0&max_results=5`;
    const r = await fetch(url, { headers: { Accept: "application/atom+xml" }, signal: AbortSignal.timeout(3000) });
    if (r.ok) {
      const text = await r.text();
      const parsed = xmlParser.parse(text);
      const entries = parsed?.feed?.entry;
      const arr: ArxivEntry[] = Array.isArray(entries) ? entries : entries ? [entries] : [];
      const titles = arr.map((e) => (typeof e.title === "string" ? e.title.trim() : "")).filter(Boolean).slice(0, 5);
      if (titles.length > 0) return res.json(titles);
    }
  } catch {
    // fall through
  }
  res.json([`${q} deep learning`, `${q} neural network`, `${q} transformer`, `${q} review 2024`, `${q} survey`]);
});

export default router;
