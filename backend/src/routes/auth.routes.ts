import { Router } from "express";
import { register, login } from "../controllers/auth.controller";
import { globalRateLimiter } from "../middlewares/globalRateLimit";

/**
 * POST /api/auth/register, POST /api/auth/login
 */
const authRouter = Router();
authRouter.use(globalRateLimiter);
authRouter.post("/register", register);
authRouter.post("/login", login);

export { authRouter };
