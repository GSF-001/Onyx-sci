import { Router } from "express";
import { db } from "@workspace/db";
import { papersTable, collectionsTable, projectsTable, researchGapsTable } from "@workspace/db";

const router = Router();

// NOTE: totalPapers / totalSearches / collaborators below are placeholders —
// there's no searches/team table wired up in this service yet. Once those
// exist, swap these constants for real db.$count(...) queries. Flagging so
// this doesn't silently ship as "real" data — collaborators here (12) doesn't
// even match the 5 static TEAM_MEMBERS used by the /team endpoint elsewhere.
const PLACEHOLDER_TOTAL_PAPERS = 100_000_000;
const PLACEHOLDER_TOTAL_SEARCHES = 48_291;
const PLACEHOLDER_COLLABORATORS = 12;
const PLACEHOLDER_GAPS_OFFSET = 847;

// Simple in-memory TTL cache so a dashboard that gets polled/refreshed a lot
// doesn't re-run 4 count queries on every single request.
// CAVEAT: this is per-process memory — fine for a single instance, but if
// this service runs multiple replicas behind a load balancer, each replica
// has its own stale cache. For real multi-instance production, replace this
// with a shared cache (Redis) or accept eventual staleness across replicas.
let cache: { data: unknown; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

router.get("/stats", async (req, res) => {
  try {
    if (cache && cache.expiresAt > Date.now()) {
      return res.json(cache.data);
    }

    // Count at the DB level instead of pulling every row into memory —
    // the previous version did db.select().from(papersTable) just to
    // read .length, which is a serious perf/memory problem at scale.
    const [paperCount, collectionCount, projectCount, gapCount] = await Promise.all([
      db.$count(papersTable),
      db.$count(collectionsTable),
      db.$count(projectsTable),
      db.$count(researchGapsTable),
    ]);

    const stats = {
      totalPapers: PLACEHOLDER_TOTAL_PAPERS,
      totalSearches: PLACEHOLDER_TOTAL_SEARCHES,
      gapsDiscovered: gapCount + PLACEHOLDER_GAPS_OFFSET,
      collaborators: PLACEHOLDER_COLLABORATORS,
      savedPapers: paperCount,
      collections: collectionCount,
      totalProjects: projectCount,
    };

    cache = { data: stats, expiresAt: Date.now() + CACHE_TTL_MS };
    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Get dashboard stats failed");
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
});

export default router;
