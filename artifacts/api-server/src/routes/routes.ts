import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db";
import { eq, desc, ilike, and } from "drizzle-orm";
import { generateId } from "../lib/id";

const router = Router();

// ---------- Shared error type ----------
// NOTE: ideally this HttpError class lives in a shared ../lib/errors module
// and is reused across every route file instead of being redefined per-file.
class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ---------- Helpers ----------

function serializeProject(p: typeof projectsTable.$inferSelect) {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null,
  };
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

// ---------- Projects ----------

// Get projects — filtering (?status=, ?search=) now happens in SQL instead of
// pulling the whole table into memory, and results are paginated
// (?page=, ?pageSize=, max 100/page).
router.get(
  "/projects",
  asyncHandler(async (req, res) => {
    const { status, search } = req.query as { status?: string; search?: string };
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);

    const conditions = [];
    if (status) conditions.push(eq(projectsTable.status, status));
    if (search) conditions.push(ilike(projectsTable.name, `%${search}%`));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, total] = await Promise.all([
      db
        .select()
        .from(projectsTable)
        .where(whereClause)
        .orderBy(desc(projectsTable.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.$count(projectsTable, whereClause),
    ]);

    res.json({
      data: rows.map(serializeProject),
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    });
  })
);

// Create project
router.post(
  "/projects",
  asyncHandler(async (req, res) => {
    const { name, description, tags = [] } = req.body as {
      name?: string;
      description?: string;
      tags?: string[];
    };

    if (!name || !name.trim()) throw new HttpError(400, "Project name is required");
    if (tags !== undefined && !Array.isArray(tags)) {
      throw new HttpError(400, "Tags must be an array of strings");
    }

    const id = generateId();
    const [project] = await db
      .insert(projectsTable)
      .values({
        id,
        name: name.trim(),
        description: description?.trim() ?? "",
        tags,
        memberCount: 1,
        paperCount: 0,
        status: "active",
      })
      .returning();

    res.status(201).json(serializeProject(project));
  })
);

// Get project by ID
router.get(
  "/projects/:id",
  asyncHandler(async (req, res) => {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, req.params.id))
      .limit(1);

    if (!project) throw new HttpError(404, "Project not found");
    res.json(serializeProject(project));
  })
);

// Update project
router.patch(
  "/projects/:id",
  asyncHandler(async (req, res) => {
    const { name, description, status, tags } = req.body as {
      name?: string;
      description?: string;
      status?: string;
      tags?: string[];
    };

    if (name !== undefined && !name.trim()) throw new HttpError(400, "Project name cannot be empty");
    if (tags !== undefined && !Array.isArray(tags)) {
      throw new HttpError(400, "Tags must be an array of strings");
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (tags !== undefined) updates.tags = tags;

    const [project] = await db
      .update(projectsTable)
      .set(updates)
      .where(eq(projectsTable.id, req.params.id))
      .returning();

    if (!project) throw new HttpError(404, "Project not found");
    res.json(serializeProject(project));
  })
);

// Delete project
router.delete(
  "/projects/:id",
  asyncHandler(async (req, res) => {
    const deleted = await db
      .delete(projectsTable)
      .where(eq(projectsTable.id, req.params.id))
      .returning({ id: projectsTable.id });

    if (deleted.length === 0) throw new HttpError(404, "Project not found");
    res.status(204).send();
  })
);

// ---------- Team ----------

router.get("/team", (req, res) => {
  const { role } = req.query as { role?: string };
  const TEAM_MEMBERS = [
    { id: "tm1", name: "Dr. Sarah Chen", email: "s.chen@mit.edu", role: "admin", avatar: null, joinedAt: "2024-01-15T00:00:00Z", institution: "MIT", paperCount: 45 },
    { id: "tm2", name: "James Rodriguez", email: "j.rodriguez@stanford.edu", role: "member", avatar: null, joinedAt: "2024-02-20T00:00:00Z", institution: "Stanford University", paperCount: 23 },
    { id: "tm3", name: "Dr. Aisha Patel", email: "a.patel@harvard.edu", role: "member", avatar: null, joinedAt: "2024-03-10T00:00:00Z", institution: "Harvard Medical School", paperCount: 67 },
    { id: "tm4", name: "Lucas Kim", email: "l.kim@caltech.edu", role: "viewer", avatar: null, joinedAt: "2024-04-05T00:00:00Z", institution: "Caltech", paperCount: 12 },
    { id: "tm5", name: "Prof. Marie Dubois", email: "m.dubois@cnrs.fr", role: "member", avatar: null, joinedAt: "2024-05-01T00:00:00Z", institution: "CNRS Paris", paperCount: 89 },
  ];
  const members = role ? TEAM_MEMBERS.filter((m) => m.role === role) : TEAM_MEMBERS;
  res.json(members);
});

// ---------- Activity ----------

router.get("/activity", (req, res) => {
  const now = new Date();
  const activities = [
    { id: "a1", type: "paper_saved", user: "Dr. Sarah Chen", description: "Saved 'Attention Is All You Need' to Deep Learning collection", createdAt: new Date(now.getTime() - 1000 * 60 * 15).toISOString(), relatedId: "paper_1" },
    { id: "a2", type: "gap_discovered", user: "James Rodriguez", description: "Discovered research gap in Protein Folding Interpretability", createdAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString(), relatedId: "gap_1" },
    { id: "a3", type: "collection_created", user: "Dr. Aisha Patel", description: "Created collection 'mRNA Therapeutics 2024'", createdAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString(), relatedId: "col_1" },
    { id: "a4", type: "search_performed", user: "Lucas Kim", description: "Searched for 'quantum error correction algorithms'", createdAt: new Date(now.getTime() - 1000 * 60 * 180).toISOString(), relatedId: null },
    { id: "a5", type: "project_created", user: "Prof. Marie Dubois", description: "Created project 'Neuro-symbolic AI for Drug Discovery'", createdAt: new Date(now.getTime() - 1000 * 60 * 360).toISOString(), relatedId: "proj_1" },
    { id: "a6", type: "paper_saved", user: "Dr. Sarah Chen", description: "Added 3 papers on CRISPR to Genomics Research collection", createdAt: new Date(now.getTime() - 1000 * 60 * 480).toISOString(), relatedId: "paper_2" },
    { id: "a7", type: "comment_added", user: "James Rodriguez", description: "Added annotation to 'AlphaFold2: Protein Structure Prediction'", createdAt: new Date(now.getTime() - 1000 * 60 * 720).toISOString(), relatedId: "paper_3" },
  ];

  const { type, limit } = req.query as { type?: string; limit?: string };
  let result = activities.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  if (type) result = result.filter((a) => a.type === type);
  if (limit) result = result.slice(0, Math.max(0, parseInt(limit, 10) || result.length));

  res.json(result);
});

export default router;
