import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./httpError";
import { logger } from "../utils/logger";
import { ZodError } from "zod";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    logger.warn({ status: err.status, code: err.code, details: err.details }, err.message);
    res.status(err.status).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
    return;
  }

  if (err instanceof ZodError) {
    logger.warn({ issues: err.flatten() }, "Validation error");
    res.status(400).json({
      error: "Invalid request body",
      code: "validation_error",
      details: err.flatten(),
    });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    error: "Internal server error",
    code: "internal_error",
  });
}
