import { Router } from "express";
import { postOnboard } from "../controllers/onboard.controller";
import { globalRateLimiter } from "../middlewares/globalRateLimit";

/**
 * Public landing integrations: POST /api/onboard
 */
const onboardApiRouter = Router();
onboardApiRouter.use(globalRateLimiter);
onboardApiRouter.post("/onboard", postOnboard);

export { onboardApiRouter };
