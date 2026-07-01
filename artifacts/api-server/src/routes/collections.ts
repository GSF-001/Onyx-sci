import { Router } from "express";
import { db } from "@workspace/db";
import { collectionsTable, papersTable } from "@workspace/db";
import { eq, inArray, ilike } from "drizzle-orm";
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

// ---------- Helpers ----------

function serializeCollection(
  c: typeof collectionsTable.$inferSelect,
  papers: object[] = []
) {
  return {
    ...c,
    tags: (c.tags as string[]) ?? [],
    paperIds: (c.paperIds as string[]) ?? [],
    papers,
    createdAt: c.createdAt.toISOString(),
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

// ---------- Collections ----------

// Get collections — ?search= now filters in SQL (ilike) instead of fetching
// every row and filtering in JS, and results are paginated.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search } = req.query as { search?: string };
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);

    const whereClause = search ? ilike(collectionsTable.name, `%${search}%`) : undefined;

    const [rows, total] = await Promise.all([
      db
        .select()
        .from(collectionsTable)
        .where(whereClause)
        .orderBy(collectionsTable.createdAt)
        .limit(pageSize)
        .offset(offset),
      db.$count(collectionsTable, whereClause),
    ]);

    res.json({
      data: rows.map((c) => serializeCollection(c)),
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    });
  })
);

// Create collection
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, description, isShared = false, tags = [] } = req.body as {
      name?: string;
      description?: string;
      isShared?: boolean;
      tags?: string[];
    };

    if (!name || !name.trim()) throw new HttpError(400, "Collection name is required");
    if (tags !== undefined && !Array.isArray(tags)) {
      throw new HttpError(400, "Tags must be an array of strings");
    }

    const id = generateId();
    const [collection] = await db
      .insert(collectionsTable)
      .values({
        id,
        name: name.trim(),
        description: description?.trim() ?? "",
        isShared,
        tags,
        paperCount: 0,
        paperIds: [],
      })
      .returning();

    res.status(201).json(serializeCollection(collection));
  })
);

// Get collection by ID (hydrates papers)
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [collection] = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, req.params.id))
      .limit(1);
    if (!collection) throw new HttpError(404, "Collection not found");

    const paperIds = (collection.paperIds as string[]) ?? [];
    let papers: object[] = [];
    if (paperIds.length > 0) {
      papers = await db.select().from(papersTable).where(inArray(papersTable.id, paperIds));
    }

    res.json(serializeCollection(collection, papers));
  })
);

// Update collection
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { name, description, isShared, tags } = req.body as {
      name?: string;
      description?: string;
      isShared?: boolean;
      tags?: string[];
    };

    if (name !== undefined && !name.trim()) throw new HttpError(400, "Collection name cannot be empty");
    if (tags !== undefined && !Array.isArray(tags)) {
      throw new HttpError(400, "Tags must be an array of strings");
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (isShared !== undefined) updates.isShared = isShared;
    if (tags !== undefined) updates.tags = tags;

    const [collection] = await db
      .update(collectionsTable)
      .set(updates)
      .where(eq(collectionsTable.id, req.params.id))
      .returning();

    if (!collection) throw new HttpError(404, "Collection not found");
    res.json(serializeCollection(collection));
  })
);

// Delete collection
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const deleted = await db
      .delete(collectionsTable)
      .where(eq(collectionsTable.id, req.params.id))
      .returning({ id: collectionsTable.id });

    if (deleted.length === 0) throw new HttpError(404, "Collection not found");
    res.status(204).send();
  })
);

// Add paper to collection
//
// FIX: the previous version did read -> mutate in JS -> write, which is a
// classic lost-update race condition: two concurrent requests adding
// different papers to the same collection could read the same paperIds
// array, and whichever write lands second would silently overwrite the
// first paper's addition. This now runs inside a transaction with a
// row-level lock (SELECT ... FOR UPDATE) so concurrent writers to the same
// collection are serialized instead of racing. (Postgres-specific — adapt
// the locking primitive if you're on a different dialect.)
router.post(
  "/:id/papers",
  asyncHandler(async (req, res) => {
    const { paperId } = req.body as { paperId?: string };
    if (!paperId || !paperId.trim()) throw new HttpError(400, "paperId is required");

    const [paper] = await db.select().from(papersTable).where(eq(papersTable.id, paperId)).limit(1);
    if (!paper) throw new HttpError(404, "Paper not found");

    const updatedCollection = await db.transaction(async (tx) => {
      const [collection] = await tx
        .select()
        .from(collectionsTable)
        .where(eq(collectionsTable.id, req.params.id))
        .for("update")
        .limit(1);
      if (!collection) throw new HttpError(404, "Collection not found");

      const paperIds = (collection.paperIds as string[]) ?? [];
      if (!paperIds.includes(paperId)) {
        paperIds.push(paperId);
        await tx
          .update(collectionsTable)
          .set({ paperIds, paperCount: paperIds.length })
          .where(eq(collectionsTable.id, req.params.id));
      }

      return { ...collection, paperIds, paperCount: paperIds.length };
    });

    res.json(serializeCollection(updatedCollection, [paper]));
  })
);

// Remove paper from collection (same lock-based transaction as above)
router.delete(
  "/:id/papers/:paperId",
  asyncHandler(async (req, res) => {
    const updatedCollection = await db.transaction(async (tx) => {
      const [collection] = await tx
        .select()
        .from(collectionsTable)
        .where(eq(collectionsTable.id, req.params.id))
        .for("update")
        .limit(1);
      if (!collection) throw new HttpError(404, "Collection not found");

      const paperIds = ((collection.paperIds as string[]) ?? []).filter(
        (id) => id !== req.params.paperId
      );

      await tx
        .update(collectionsTable)
        .set({ paperIds, paperCount: paperIds.length })
        .where(eq(collectionsTable.id, req.params.id));

      return { ...collection, paperIds, paperCount: paperIds.length };
    });

    res.json(serializeCollection(updatedCollection));
  })
);

export default router;
