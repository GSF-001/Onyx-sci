import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateId } from "../lib/id";

const router = Router();

// Static team members data
const TEAM_MEMBERS = [
  { id: "tm1", name: "Dr. Sarah Chen", email: "s.chen@mit.edu", role: "admin", avatar: null, joinedAt: "2024-01-15T00:00:00Z", institution: "MIT", paperCount: 45 },
  { id: "tm2", name: "James Rodriguez", email: "j.rodriguez@stanford.edu", role: "member", avatar: null, joinedAt: "2024-02-20T00:00:00Z", institution: "Stanford University", paperCount: 23 },
  { id: "tm3", name: "Dr. Aisha Patel", email: "a.patel@harvard.edu", role: "member", avatar: null, joinedAt: "2024-03-10T00:00:00Z", institution: "Harvard Medical School", paperCount: 67 },
  { id: "tm4", name: "Lucas Kim", email: "l.kim@caltech.edu", role: "viewer", avatar: null, joinedAt: "2024-04-05T00:00:00Z", institution: "Caltech", paperCount: 12 },
  { id: "tm5", name: "Prof. Marie Dubois", email: "m.dubois@cnrs.fr", role: "member", avatar: null, joinedAt: "2024-05-01T00:00:00Z", institution: "CNRS Paris", paperCount: 89 },
];

// Get projects
router.get("/projects", async (_req, res) => {
  try {
    const projects = await db
      .select()
      .from(projectsTable)
      .orderBy(projectsTable.createdAt);
    res.json(projects.map(p => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "Get projects failed");
    res.status(500).json({ error: "Failed to get projects" });
  }
});

// Create project
router.post("/projects", async (req, res) => {
  const { name, description, tags = [] } = req.body as { name: string; description: string; tags?: string[] };
  try {
    const id = generateId();
    const [project] = await db
      .insert(projectsTable)
      .values({ id, name, description, tags, memberCount: 1, paperCount: 0, status: "active" })
      .returning();
    res.status(201).json({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Create project failed");
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Get project by ID
router.get("/projects/:id", async (req, res) => {
  try {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, req.params.id))
      .limit(1);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ ...project, createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt?.toISOString() ?? null });
  } catch (err) {
    req.log.error({ err }, "Get project failed");
    res.status(500).json({ error: "Failed to get project" });
  }
});

// Update project
router.patch("/projects/:id", async (req, res) => {
  const { name, description, status, tags } = req.body as {
    name?: string;
    description?: string;
    status?: string;
    tags?: string[];
  };
  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (tags !== undefined) updates.tags = tags;

    const [project] = await db
      .update(projectsTable)
      .set(updates)
      .where(eq(projectsTable.id, req.params.id))
      .returning();
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ ...project, createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt?.toISOString() ?? null });
  } catch (err) {
    req.log.error({ err }, "Update project failed");
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete project
router.delete("/projects/:id", async (req, res) => {
  try {
    await db.delete(projectsTable).where(eq(projectsTable.id, req.params.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete project failed");
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Get team members
router.get("/team", async (_req, res) => {
  res.json(TEAM_MEMBERS);
});

// Get recent activity
router.get("/activity", async (_req, res) => {
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
  res.json(activities);
});

export default router;
