import { Router } from "express";
import { getDailyReport, get14DayReport } from "../controllers/report.controller";
import { getHealth } from "../controllers/health.controller";
import { postTestSimulateInbound } from "../controllers/testSimulate.controller";
import { globalRateLimiter } from "../middlewares/globalRateLimit";
import { requireAuth } from "../middlewares/requireAuth";

const apiRouter = Router();

apiRouter.use(globalRateLimiter);

apiRouter.get("/reports/daily", getDailyReport);
apiRouter.get("/reports/14days", requireAuth, get14DayReport);
apiRouter.post("/test/simulate-inbound", postTestSimulateInbound);
apiRouter.get("/health", getHealth);

export { apiRouter };
