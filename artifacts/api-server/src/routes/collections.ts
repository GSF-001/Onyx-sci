import { Router } from "express";
import { db } from "@workspace/db";
import { collectionsTable, papersTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { generateId } from "../lib/id";

const router = Router();

// Get collections
router.get("/", async (_req, res) => {
  try {
    const collections = await db
      .select()
      .from(collectionsTable)
      .orderBy(collectionsTable.createdAt);
    res.json(collections.map(c => ({
      ...c,
      tags: (c.tags as string[]) ?? [],
      papers: [],
      createdAt: c.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Get collections failed");
    res.status(500).json({ error: "Failed to get collections" });
  }
});

// Create collection
router.post("/", async (req, res) => {
  const { name, description, isShared = false, tags = [] } = req.body as {
    name: string;
    description: string;
    isShared?: boolean;
    tags?: string[];
  };
  try {
    const id = generateId();
    const [collection] = await db
      .insert(collectionsTable)
      .values({ id, name, description, isShared, tags, paperCount: 0, paperIds: [] })
      .returning();
    res.status(201).json({
      ...collection,
      tags: (collection.tags as string[]) ?? [],
      papers: [],
      createdAt: collection.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create collection failed");
    res.status(500).json({ error: "Failed to create collection" });
  }
});

// Get collection by ID
router.get("/:id", async (req, res) => {
  try {
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

    res.json({
      ...collection,
      tags: (collection.tags as string[]) ?? [],
      papers,
      createdAt: collection.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Get collection failed");
    res.status(500).json({ error: "Failed to get collection" });
  }
});

// Add paper to collection
router.post("/:id/papers", async (req, res) => {
  const { paperId } = req.body as { paperId: string };
  try {
    const [collection] = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, req.params.id))
      .limit(1);
    if (!collection) return res.status(404).json({ error: "Collection not found" });

    const paperIds = (collection.paperIds as string[]) ?? [];
    if (!paperIds.includes(paperId)) {
      paperIds.push(paperId);
      await db
        .update(collectionsTable)
        .set({ paperIds, paperCount: paperIds.length })
        .where(eq(collectionsTable.id, req.params.id));
    }

    res.json({ ...collection, paperIds, paperCount: paperIds.length, papers: [], tags: (collection.tags as string[]) ?? [], createdAt: collection.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Add paper to collection failed");
    res.status(500).json({ error: "Failed to add paper to collection" });
  }
});

export default router;
