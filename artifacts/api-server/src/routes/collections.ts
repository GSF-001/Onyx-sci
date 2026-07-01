import { Router } from "express";
import { db } from "@workspace/db";
import { collectionsTable, papersTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { generateId } from "../lib/id";

const router = Router();

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

function asyncHandler(
  fn: (req: import("express").Request, res: import("express").Response) => Promise<void>
) {
  return async (req: import("express").Request, res: import("express").Response) => {
    try {
      await fn(req, res);
    } catch (err) {
      req.log.error({ err }, `${req.method} ${req.originalUrl} failed`);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

// ---------- Collections ----------

// Get collections (supports optional ?search= on name)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search } = req.query as { search?: string };

    let collections = await db
      .select()
      .from(collectionsTable)
      .orderBy(collectionsTable.createdAt);

    if (search) {
      const q = search.toLowerCase();
      collections = collections.filter((c) => c.name.toLowerCase().includes(q));
    }

    // Papers aren't hydrated on the list view (kept lightweight on purpose);
    // fetch a single collection by ID to get its papers populated.
    res.json(collections.map((c) => serializeCollection(c)));
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

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Collection name is required" });
    }
    if (tags !== undefined && !Array.isArray(tags)) {
      return res.status(400).json({ error: "Tags must be an array of strings" });
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
    if (!collection) return res.status(404).json({ error: "Collection not found" });

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

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: "Collection name cannot be empty" });
    }
    if (tags !== undefined && !Array.isArray(tags)) {
      return res.status(400).json({ error: "Tags must be an array of strings" });
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

    if (!collection) return res.status(404).json({ error: "Collection not found" });
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

    if (deleted.length === 0) {
      return res.status(404).json({ error: "Collection not found" });
    }
    res.status(204).send();
  })
);

// Add paper to collection
router.post(
  "/:id/papers",
  asyncHandler(async (req, res) => {
    const { paperId } = req.body as { paperId?: string };
    if (!paperId || !paperId.trim()) {
      return res.status(400).json({ error: "paperId is required" });
    }

    const [collection] = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, req.params.id))
      .limit(1);
    if (!collection) return res.status(404).json({ error: "Collection not found" });

    // Make sure the paper actually exists before attaching it
    const [paper] = await db
      .select()
      .from(papersTable)
      .where(eq(papersTable.id, paperId))
      .limit(1);
    if (!paper) return res.status(404).json({ error: "Paper not found" });

    const paperIds = (collection.paperIds as string[]) ?? [];
    if (!paperIds.includes(paperId)) {
      paperIds.push(paperId);
      await db
        .update(collectionsTable)
        .set({ paperIds, paperCount: paperIds.length })
        .where(eq(collectionsTable.id, req.params.id));
    }

    res.json(
      serializeCollection(
        { ...collection, paperIds, paperCount: paperIds.length },
        [paper]
      )
    );
  })
);

// Remove paper from collection
router.delete(
  "/:id/papers/:paperId",
  asyncHandler(async (req, res) => {
    const [collection] = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, req.params.id))
      .limit(1);
    if (!collection) return res.status(404).json({ error: "Collection not found" });

    const paperIds = ((collection.paperIds as string[]) ?? []).filter(
      (id) => id !== req.params.paperId
    );

    await db
      .update(collectionsTable)
      .set({ paperIds, paperCount: paperIds.length })
      .where(eq(collectionsTable.id, req.params.id));

    res.json(
      serializeCollection({ ...collection, paperIds, paperCount: paperIds.length })
    );
  })
);

export default router;
