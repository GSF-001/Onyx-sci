// papers.ts
import { Router } from "express";
import { db } from "@workspace/db";
import { papersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateId } from "../lib/id";

const router = Router();

// Get saved papers
router.get("/", async (req, res) => {
  try {
    const papers = await db
      .select()
      .from(papersTable)
      .orderBy(papersTable.createdAt);
    res.json(papers.map(p => ({
      ...p,
      authors: (p.authors as string[]) ?? [],
      keywords: (p.keywords as string[]) ?? [],
      savedAt: p.savedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "Get papers failed");
    res.status(500).json({ error: "Failed to get papers" });
  }
});

// Get paper by ID
router.get("/:id", async (req, res) => {
  try {
    const [paper] = await db
      .select()
      .from(papersTable)
      .where(eq(papersTable.id, req.params.id))
      .limit(1);
    if (!paper) return res.status(404).json({ error: "Paper not found" });
    res.json({
      ...paper,
      authors: (paper.authors as string[]) ?? [],
      keywords: (paper.keywords as string[]) ?? [],
      savedAt: paper.savedAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Get paper failed");
    res.status(500).json({ error: "Failed to get paper" });
  }
});

// Save a paper (upsert)
router.post("/:id/save", async (req, res) => {
  const { id } = req.params;
  const paperData = req.body;

  try {
    const values = {
      id: id || generateId(),
      title: paperData.title ?? "Untitled Paper",
      authors: paperData.authors ?? [],
      year: paperData.year ?? new Date().getFullYear(),
      abstract: paperData.abstract ?? "",
      journal: paperData.journal ?? null,
      citationCount: paperData.citationCount ?? 0,
      doi: paperData.doi ?? null,
      arxivId: paperData.arxivId ?? null,
      url: paperData.url ?? null,
      field: paperData.field ?? null,
      keywords: paperData.keywords ?? [],
      noveltyScore: paperData.noveltyScore ?? null,
      relevanceScore: paperData.relevanceScore ?? null,
      isOpenAccess: paperData.isOpenAccess ?? false,
      savedAt: new Date(),
    };

    // Single atomic upsert: no select-then-write race condition, and on conflict
    // we overwrite the full row with the new metadata (not just savedAt).
    const [saved] = await db
      .insert(papersTable)
      .values(values)
      .onConflictDoUpdate({
        target: papersTable.id,
        set: {
          title: values.title,
          authors: values.authors,
          year: values.year,
          abstract: values.abstract,
          journal: values.journal,
          citationCount: values.citationCount,
          doi: values.doi,
          arxivId: values.arxivId,
          url: values.url,
          field: values.field,
          keywords: values.keywords,
          noveltyScore: values.noveltyScore,
          relevanceScore: values.relevanceScore,
          isOpenAccess: values.isOpenAccess,
          savedAt: values.savedAt,
        },
      })
      .returning();

    res.json({
      ...saved,
      authors: (saved.authors as string[]) ?? [],
      keywords: (saved.keywords as string[]) ?? [],
      savedAt: saved.savedAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Save paper failed");
    res.status(500).json({ error: "Failed to save paper" });
  }
});

export default router;
