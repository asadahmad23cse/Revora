import { Router } from "express";
import { postOnboard } from "../controllers/onboard.controller";
import { globalRateLimiter } from "../middlewares/globalRateLimit";
import { optionalAuth } from "../middlewares/optionalAuth";

/**
 * Public landing integrations: POST /api/onboard
 */
const onboardApiRouter = Router();
onboardApiRouter.use(globalRateLimiter);
onboardApiRouter.use(optionalAuth);
onboardApiRouter.post("/onboard", postOnboard);

export { onboardApiRouter };
