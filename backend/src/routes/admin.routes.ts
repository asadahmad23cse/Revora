import { Router } from "express";
import { getLeads, patchLead, postLeadFollowup } from "../controllers/leads.controller";
import { getMetrics } from "../controllers/metrics.controller";
import { globalRateLimiter } from "../middlewares/globalRateLimit";
import { optionalAdminAuth } from "../middlewares/adminOptionalAuth";

const adminApiRouter = Router();

adminApiRouter.use(globalRateLimiter);
adminApiRouter.use(optionalAdminAuth);

adminApiRouter.get("/leads", getLeads);
adminApiRouter.patch("/leads/:id", patchLead);
adminApiRouter.post("/leads/:id/followup", postLeadFollowup);
adminApiRouter.get("/metrics", getMetrics);

export { adminApiRouter };
