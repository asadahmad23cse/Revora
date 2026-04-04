import { Router } from "express";
import { getDailyReport, get14DayReport } from "../controllers/report.controller";
import { getHealth } from "../controllers/health.controller";
import { globalRateLimiter } from "../middlewares/globalRateLimit";

const apiRouter = Router();

apiRouter.use(globalRateLimiter);

apiRouter.get("/reports/daily", getDailyReport);
apiRouter.get("/reports/14days", get14DayReport);
apiRouter.get("/health", getHealth);

export { apiRouter };
