import { Router } from "express";
import { chatCompletion } from "../lib/groq";

const router = Router();

// Semantic search using GROQ AI to simulate paper search
router.post("/", async (req, res) => {
  const { query, field, limit = 10, filters } = req.body as {
    query: string;
    field?: string;
    limit?: number;
    filters?: { yearFrom?: number; yearTo?: number; openAccess?: boolean; minCitations?: number };
  };

  try {
    const prompt = `You are a scientific literature search engine. Generate ${limit} realistic research paper results for the query: "${query}"${field ? ` in the field of ${field}` : ""}.

For each paper, generate a JSON array with exactly this structure:
{
  "papers": [
    {
      "id": "paper_<unique_id>",
      "title": "Realistic paper title",
      "authors": ["Author One", "Author Two"],
      "year": 2022,
      "abstract": "Detailed abstract of 2-3 sentences describing the paper's contribution",
      "journal": "Nature / Science / PLOS ONE / etc.",
      "citationCount": 45,
      "doi": "10.xxxx/xxxxx",
      "field": "${field || "Computer Science"}",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "noveltyScore": 7.8,
      "relevanceScore": 9.2,
      "isOpenAccess": true
    }
  ],
  "aiSummary": "A 2-sentence synthesis of the search results landscape"
}

Generate papers from real research areas. Vary years between ${filters?.yearFrom ?? 2019} and ${filters?.yearTo ?? 2024}. Make abstracts scientifically plausible. Return ONLY valid JSON.`;

    const response = await chatCompletion([{ role: "user", content: prompt }], {
      temperature: 0.8,
      maxTokens: 3000,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse search response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    res.json({ ...parsed, total: parsed.papers.length, query });
  } catch (err) {
    req.log.error({ err }, "Search failed");
    res.status(500).json({ error: "Search failed" });
  }
});

// Trending searches
router.get("/trending", async (_req, res) => {
  res.json([
    { query: "protein folding with deep learning", count: 1245, field: "Computational Biology" },
    { query: "large language models in drug discovery", count: 987, field: "Pharmacology" },
    { query: "CRISPR gene editing cancer therapy", count: 876, field: "Oncology" },
    { query: "quantum computing error correction", count: 654, field: "Physics" },
    { query: "transformer architecture multimodal", count: 612, field: "Machine Learning" },
    { query: "climate change carbon capture materials", count: 541, field: "Environmental Science" },
    { query: "neuromorphic computing brain-inspired", count: 498, field: "Computer Science" },
    { query: "mRNA vaccine delivery mechanisms", count: 445, field: "Immunology" },
  ]);
});

// Search suggestions
router.get("/suggestions", async (req, res) => {
  const q = req.query.q as string;
  if (!q || q.length < 2) return res.json([]);

  const suggestions = [
    `${q} deep learning`,
    `${q} neural networks`,
    `${q} machine learning applications`,
    `${q} systematic review`,
    `${q} meta-analysis`,
    `${q} computational methods`,
    `${q} clinical trials`,
    `${q} emerging trends`,
  ].slice(0, 6);

  res.json(suggestions);
});

export default router;
