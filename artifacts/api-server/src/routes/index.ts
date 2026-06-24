import { Router, type IRouter } from "express";
import healthRouter from "./health";
import searchRouter from "./search";
import copilotRouter from "./copilot";
import knowledgeGraphRouter from "./knowledge-graph";
import gapsRouter from "./gaps";
import trendsRouter from "./trends";
import collaborateRouter from "./collaborate";
import papersRouter from "./papers";
import collectionsRouter from "./collections";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/search", searchRouter);
router.use("/copilot", copilotRouter);
router.use("/knowledge-graph", knowledgeGraphRouter);
router.use("/gaps", gapsRouter);
router.use("/trends", trendsRouter);
router.use("/collaborate", collaborateRouter);
router.use("/papers", papersRouter);
router.use("/collections", collectionsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
