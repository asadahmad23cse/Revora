import { Router } from "express";
import { patchLead, postLeadFollowup } from "../controllers/leads.controller";
import { getMetrics } from "../controllers/metrics.controller";
import { globalRateLimiter } from "../middlewares/globalRateLimit";
import { requireAuth } from "../middlewares/requireAuth";

const adminApiRouter = Router();

adminApiRouter.use(globalRateLimiter);
adminApiRouter.use(requireAuth);

adminApiRouter.patch("/leads/:id", patchLead);
adminApiRouter.post("/leads/:id/followup", postLeadFollowup);
adminApiRouter.get("/metrics", getMetrics);

export { adminApiRouter };
