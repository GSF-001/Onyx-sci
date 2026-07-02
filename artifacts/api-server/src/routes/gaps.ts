import { Router } from "express";
import { db } from "@workspace/db";
import { researchGapsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { chatCompletion } from "../lib/groq";
import { generateId } from "../lib/id";

const router = Router();

// NOTE: ideally shared with the other route files via ../lib/errors
class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const VALID_LEVELS = new Set(["Low", "Medium", "High"]);

type Gap = {
  title: string;
  description: string;
  impactScore: number;
  competitionLevel: string;
  difficultyLevel: string;
  relatedPapers?: number;
  opportunity: string;
};

// ---------- Helpers ----------

function serializeGap(g: typeof researchGapsTable.$inferSelect) {
  return { ...g, discoveredAt: g.discoveredAt.toISOString() };
}

function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(query.pageSize ?? "20"), 10) || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

function asyncHandler(
  fn: (req: import("express").Request, res: import("express").Response) => Promise<void>
) {
  return async (req: import("express").Request, res: import("express").Response) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message });
      }
      req.log.error({ err }, `${req.method} ${req.originalUrl} failed`);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number; response?: { status?: number } })?.status
    ?? (err as { response?: { status?: number } })?.response?.status;
  if (status === undefined) return true;
  return status === 429 || status >= 500;
}

// Retry with exponential backoff, same policy as the copilot routes
async function chatCompletionWithRetry(
  messages: Parameters<typeof chatCompletion>[0],
  options: Parameters<typeof chatCompletion>[1],
  maxAttempts = 3
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await chatCompletion(messages, options);
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts || !isRetryable(err)) throw err;
      await sleep(300 * 2 ** (attempt - 1));
    }
  }
  throw lastErr;
}

// Don't trust the model's JSON blindly — validate shape/ranges before it
// ever touches the DB. A hallucinated field (wrong type, out-of-range score,
// invalid enum value) would otherwise get written straight into the table
// and corrupt data any frontend logic relies on.
function validateGap(raw: unknown): Gap | null {
  if (typeof raw !== "object" || raw === null) return null;
  const g = raw as Record<string, unknown>;

  if (typeof g.title !== "string" || !g.title.trim()) return null;
  if (typeof g.description !== "string" || !g.description.trim()) return null;
  if (typeof g.opportunity !== "string" || !g.opportunity.trim()) return null;
  if (typeof g.impactScore !== "number" || g.impactScore < 0 || g.impactScore > 10) return null;
  if (typeof g.competitionLevel !== "string" || !VALID_LEVELS.has(g.competitionLevel)) return null;
  if (typeof g.difficultyLevel !== "string" || !VALID_LEVELS.has(g.difficultyLevel)) return null;

  const relatedPapers =
    typeof g.relatedPapers === "number" && g.relatedPapers >= 0 ? Math.floor(g.relatedPapers) : 0;

  return {
    title: g.title.trim(),
    description: g.description.trim(),
    impactScore: g.impactScore,
    competitionLevel: g.competitionLevel,
    difficultyLevel: g.difficultyLevel,
    relatedPapers,
    opportunity: g.opportunity.trim(),
  };
}

// ---------- Discover ----------

router.post(
  "/discover",
  asyncHandler(async (req, res) => {
    const { field, subfield, context } = req.body as {
      field?: string;
      subfield?: string;
      context?: string;
    };

    if (!field || !field.trim()) throw new HttpError(400, "field is required");
    if (field.length > 200) throw new HttpError(400, "field is too long (max 200 chars)");
    if (context && context.length > 2000) throw new HttpError(400, "context is too long (max 2000 chars)");

    const prompt = `You are a research gap analysis engine. Identify 5 significant research gaps in the field of "${field}"${subfield ? ` / ${subfield}` : ""}${context ? `. Context: ${context.slice(0, 2000)}` : ""}.

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

    const response = await chatCompletionWithRetry([{ role: "user", content: prompt }], {
      temperature: 0.5,
      maxTokens: 2000,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new HttpError(502, "AI response could not be parsed");

    let parsed: { gaps?: unknown[]; summary?: string };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (_) {
      throw new HttpError(502, "AI response could not be parsed");
    }

    if (!Array.isArray(parsed.gaps) || parsed.gaps.length === 0) {
      throw new HttpError(502, "AI response did not contain any gaps");
    }

    const validGaps = parsed.gaps.map(validateGap).filter((g): g is Gap => g !== null);
    if (validGaps.length === 0) {
      throw new HttpError(502, "AI response did not contain any valid gaps");
    }

    const analysisId = generateId();
    const now = new Date();

    // Wrapped in a transaction: if any insert fails partway through, all of
    // them roll back instead of leaving a partial batch of gaps in the DB.
    const savedGaps = await db.transaction(async (tx) => {
      const rows = [];
      for (const gap of validGaps) {
        const [saved] = await tx
          .insert(researchGapsTable)
          .values({
            id: generateId(),
            title: gap.title,
            description: gap.description,
            impactScore: gap.impactScore,
            competitionLevel: gap.competitionLevel,
            difficultyLevel: gap.difficultyLevel,
            field: field.trim(),
            relatedPapers: gap.relatedPapers ?? 0,
            opportunity: gap.opportunity,
            discoveredAt: now,
          })
          .returning();
        rows.push(saved);
      }
      return rows;
    });

    res.json({
      gaps: savedGaps.map(serializeGap),
      field: field.trim(),
      analysisId,
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
    });
  })
);

// ---------- Recent ----------

// Get recent gaps — supports ?field= filter and pagination
router.get(
  "/recent",
  asyncHandler(async (req, res) => {
    const { field } = req.query as { field?: string };
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);

    const whereClause = field ? eq(researchGapsTable.field, field) : undefined;

    const [rows, total] = await Promise.all([
      db
        .select()
        .from(researchGapsTable)
        .where(whereClause)
        .orderBy(desc(researchGapsTable.discoveredAt))
        .limit(pageSize)
        .offset(offset),
      db.$count(researchGapsTable, whereClause),
    ]);

    res.json({
      data: rows.map(serializeGap),
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    });
  })
);

// ---------- Get by ID ----------

// FIX: this previously ran `db.select().from(researchGapsTable).limit(1)`
// with NO where clause at all, so every request — regardless of :id —
// returned whatever the first row in the table happened to be. Now it
// actually filters by the requested id.
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [gap] = await db
      .select()
      .from(researchGapsTable)
      .where(eq(researchGapsTable.id, req.params.id))
      .limit(1);

    if (!gap) throw new HttpError(404, "Gap not found");
    res.json(serializeGap(gap));
  })
);

// ---------- Delete ----------

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const deleted = await db
      .delete(researchGapsTable)
      .where(eq(researchGapsTable.id, req.params.id))
      .returning({ id: researchGapsTable.id });

    if (deleted.length === 0) throw new HttpError(404, "Gap not found");
    res.status(204).send();
  })
);

export default router;
