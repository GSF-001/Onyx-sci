import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// Bounds how long a readiness check is allowed to hang waiting on the DB.
// Without this, a slow/hung DB connection would make /readyz hang
// indefinitely instead of failing fast — which is exactly the kind of thing
// that cascades into a full outage under load.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("health check timed out")), ms)),
  ]);
}

function respondHealthCheck(res: import("express").Response, status: "ok") {
  // safeParse (not parse) so a schema mismatch surfaces as a real error
  // response instead of throwing and crashing the request unhandled.
  const parsed = HealthCheckResponse.safeParse({ status });
  if (!parsed.success) {
    return res.status(500).json({ status: "error", error: "Invalid health check response shape" });
  }
  return res.json(parsed.data);
}

// Liveness — is the process itself up and responsive? Deliberately does NOT
// check the database: if the DB is temporarily down but this process is
// fine, we don't want an orchestrator killing/restarting a healthy instance
// over a dependency it doesn't own.
router.get("/healthz", (_req, res) => {
  respondHealthCheck(res, "ok");
});

// Readiness — can this instance actually serve real traffic right now?
// Almost every route in this service depends on the DB, so readiness
// checks that it's actually reachable, with a hard timeout so a slow DB
// fails fast (503) instead of hanging the health check itself.
router.get("/readyz", async (req, res) => {
  try {
    await withTimeout(db.execute(sql`SELECT 1`), 2000);
    respondHealthCheck(res, "ok");
  } catch (err) {
    req.log?.warn?.({ err }, "Readiness check failed");
    res.status(503).json({ status: "error", error: "Database unavailable" });
  }
});

export default router;
