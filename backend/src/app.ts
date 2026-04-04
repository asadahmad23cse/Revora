import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import { config } from "./config";
import { webhookRouter } from "./routes/webhook.routes";
import { apiRouter } from "./routes/api.routes";
import { onboardApiRouter } from "./routes/onboard.routes";
import { adminApiRouter } from "./routes/admin.routes";
import { leadsRouter } from "./routes/leads.routes";
import { aiRouter } from "./routes/ai.routes";
import { devRouter } from "./routes/dev.routes";
import { errorHandler } from "./middlewares/errorHandler";
import { logger } from "./utils/logger";
import { requestIdMiddleware } from "./middlewares/requestId";

export function createApp(): express.Application {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: "http://localhost:3000" }));
  app.use(helmet());
  app.use(requestIdMiddleware);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => {
        const id = (req as express.Request & { id?: string }).id;
        return id && id.length > 0 ? id : randomUUID();
      },
      customProps: (req) => ({
        requestId: (req as express.Request & { id?: string }).id,
      }),
      autoLogging: {
        ignore: (req) => req.url === "/health",
      },
    }),
  );

  app.use(webhookRouter);
  app.use(express.json({ limit: "512kb" }));
  if (config.nodeEnv === "development") {
    app.use("/dev", devRouter);
  }
  app.use("/api", onboardApiRouter);
  app.use("/api", leadsRouter);
  app.use("/api", adminApiRouter);
  app.use(apiRouter);
  app.use("/ai", aiRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found", code: "not_found" });
  });

  app.use(errorHandler);

  return app;
}
