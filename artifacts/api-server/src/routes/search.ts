import { Router } from "express";
import { chatCompletion } from "../lib/groq";

const router = Router();

const SS_BASE = "https://api.semanticscholar.org/graph/v1";
const SS_FIELDS = "title,authors,year,abstract,citationCount,isOpenAccess,externalIds,journal,venue,openAccessPdf";

interface SSPaper {
  paperId: string;
  title: string;
  authors: { name: string }[];
  year: number | null;
  abstract: string | null;
  citationCount: number;
  isOpenAccess: boolean;
  externalIds: { DOI?: string; ArXiv?: string } | null;
  journal: { name: string; volume?: string; pages?: string } | null;
  venue: string | null;
  openAccessPdf: { url: string } | null;
}

async function searchSemanticScholar(query: string, limit = 10, offset = 0) {
  const url = `${SS_BASE}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&fields=${SS_FIELDS}`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Semantic Scholar API error: ${res.status}`);
  const data = await res.json() as { total: number; data: SSPaper[] };
  return data;
}

function formatSSPaper(p: SSPaper, index: number) {
  const doi = p.externalIds?.DOI;
  const arxiv = p.externalIds?.ArXiv;
  const url = doi
    ? `https://doi.org/${doi}`
    : arxiv
    ? `https://arxiv.org/abs/${arxiv}`
    : `https://www.semanticscholar.org/paper/${p.paperId}`;
  return {
    id: p.paperId || `ss_${index}`,
    title: p.title ?? "Untitled",
    authors: p.authors.map((a) => a.name),
    year: p.year ?? null,
    abstract: p.abstract ?? "",
    journal: p.journal?.name ?? p.venue ?? null,
    citationCount: p.citationCount ?? 0,
    doi: doi ?? null,
    isOpenAccess: p.isOpenAccess ?? false,
    url,
    pdfUrl: p.openAccessPdf?.url ?? null,
    noveltyScore: null,
    relevanceScore: null,
  };
}

// Semantic search — real papers from Semantic Scholar, AI summary from GROQ
router.post("/", async (req, res) => {
  const { query, limit = 10, offset = 0, filters } = req.body as {
    query: string;
    limit?: number;
    offset?: number;
    filters?: { yearFrom?: number; yearTo?: number; openAccess?: boolean; minCitations?: number };
  };

  if (!query?.trim()) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const ssData = await searchSemanticScholar(query, Math.min(limit, 20), offset);
    let papers = ssData.data.map(formatSSPaper);

    // Apply filters client-side
    if (filters?.yearFrom) papers = papers.filter((p) => p.year == null || p.year >= filters.yearFrom!);
    if (filters?.yearTo) papers = papers.filter((p) => p.year == null || p.year <= filters.yearTo!);
    if (filters?.openAccess) papers = papers.filter((p) => p.isOpenAccess);
    if (filters?.minCitations) papers = papers.filter((p) => p.citationCount >= filters.minCitations!);

    // AI summary (non-blocking — don't fail if GROQ is slow)
    let aiSummary: string | null = null;
    try {
      const titlesSnippet = papers
        .slice(0, 5)
        .map((p) => p.title)
        .join("; ");
      const summaryRes = await chatCompletion(
        [
          {
            role: "user",
            content: `In 2 sentences, synthesize the research landscape for the query "${query}" based on these papers: ${titlesSnippet}. Be concise and scientifically precise.`,
          },
        ],
        { temperature: 0.5, maxTokens: 150 }
      );
      aiSummary = summaryRes.trim();
    } catch {
      // Summary is optional
    }

    res.json({ papers, total: ssData.total ?? papers.length, query, aiSummary });
  } catch (err) {
    req.log.error({ err }, "Semantic Scholar search failed");
    res.status(500).json({ error: "Search failed. Please try again." });
  }
});

// Trending searches (static curated list)
router.get("/trending", async (_req, res) => {
  res.json([
    { query: "protein folding deep learning", count: 1245, field: "Computational Biology" },
    { query: "large language models drug discovery", count: 987, field: "Pharmacology" },
    { query: "CRISPR gene editing cancer therapy", count: 876, field: "Oncology" },
    { query: "quantum computing error correction", count: 654, field: "Physics" },
    { query: "transformer multimodal learning", count: 612, field: "Machine Learning" },
    { query: "climate change carbon capture", count: 541, field: "Environmental Science" },
    { query: "single cell RNA sequencing", count: 498, field: "Genomics" },
    { query: "mRNA vaccine delivery mechanisms", count: 445, field: "Immunology" },
  ]);
});

// Autocomplete suggestions
router.get("/suggestions", async (req, res) => {
  const q = req.query.q as string;
  if (!q || q.length < 2) return res.json([]);
  try {
    const url = `${SS_BASE}/paper/search/bulk?query=${encodeURIComponent(q)}&limit=5&fields=title`;
    const r = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(3000) });
    if (r.ok) {
      const data = await r.json() as { data: { title: string }[] };
      return res.json(data.data.map((p) => p.title).filter(Boolean).slice(0, 6));
    }
  } catch {
    // fall through
  }
  const suggestions = [`${q} review`, `${q} deep learning`, `${q} clinical study`, `${q} meta-analysis`];
  res.json(suggestions);
});

export default router;
