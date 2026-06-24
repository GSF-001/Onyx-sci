import { Router } from "express";
import { db } from "@workspace/db";
import { researchGapsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { chatCompletion } from "../lib/groq";
import { generateId } from "../lib/id";

const router = Router();

// Discover research gaps
router.post("/discover", async (req, res) => {
  const { field, subfield, context } = req.body as {
    field: string;
    subfield?: string;
    context?: string;
  };

  try {
    const prompt = `You are a research gap analysis engine. Identify 5 significant research gaps in the field of "${field}"${subfield ? ` / ${subfield}` : ""}${context ? `. Context: ${context}` : ""}.

For each gap, analyze the current state of research and identify where breakthroughs are most needed.

Respond in this exact JSON format:
{
  "gaps": [
    {
      "title": "Specific gap title",
      "description": "2-3 sentence description of the gap and why it matters",
      "impactScore": 8.5,
      "competitionLevel": "Low",
      "difficultyLevel": "Medium",
      "relatedPapers": 127,
      "opportunity": "Specific research opportunity or direction"
    }
  ],
  "summary": "2-sentence overview of the research landscape in this field"
}

impactScore is 0-10 (higher = more impactful)
competitionLevel and difficultyLevel must be exactly "Low", "Medium", or "High"
Generate exactly 5 gaps. Return ONLY valid JSON.`;

    const response = await chatCompletion([{ role: "user", content: prompt }], {
      temperature: 0.5,
      maxTokens: 2000,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse gaps");
    const parsed = JSON.parse(jsonMatch[0]);

    // Save gaps to DB
    const analysisId = generateId();
    const now = new Date();
    const savedGaps = await Promise.all(
      parsed.gaps.map(async (gap: Record<string, unknown>) => {
        const id = generateId();
        const [saved] = await db
          .insert(researchGapsTable)
          .values({
            id,
            title: gap.title as string,
            description: gap.description as string,
            impactScore: gap.impactScore as number,
            competitionLevel: gap.competitionLevel as string,
            difficultyLevel: gap.difficultyLevel as string,
            field,
            relatedPapers: (gap.relatedPapers as number) ?? 0,
            opportunity: gap.opportunity as string,
            discoveredAt: now,
          })
          .returning();
        return saved;
      })
    );

    res.json({
      gaps: savedGaps.map(g => ({ ...g, discoveredAt: g.discoveredAt.toISOString() })),
      field,
      analysisId,
      summary: parsed.summary,
    });
  } catch (err) {
    req.log.error({ err }, "Gap discovery failed");
    res.status(500).json({ error: "Failed to discover research gaps" });
  }
});

// Get recent gaps
router.get("/recent", async (_req, res) => {
  try {
    const gaps = await db
      .select()
      .from(researchGapsTable)
      .orderBy(desc(researchGapsTable.discoveredAt))
      .limit(20);
    res.json(gaps.map(g => ({ ...g, discoveredAt: g.discoveredAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Get recent gaps failed");
    res.status(500).json({ error: "Failed to get recent gaps" });
  }
});

// Get specific gap
router.get("/:id", async (req, res) => {
  try {
    const gaps = await db
      .select()
      .from(researchGapsTable)
      .limit(1);

    if (!gaps.length) {
      return res.status(404).json({ error: "Gap not found" });
    }

    const gap = gaps[0];
    res.json({ ...gap, discoveredAt: gap.discoveredAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Get gap failed");
    res.status(500).json({ error: "Failed to get gap" });
  }
});

export default router;
