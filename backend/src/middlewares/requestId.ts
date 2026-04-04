import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const fromHeader =
    typeof req.headers["x-request-id"] === "string" ? req.headers["x-request-id"].trim() : "";
  const id = fromHeader.length > 0 ? fromHeader : randomUUID();
  (req as Request & { id?: string }).id = id;
  res.setHeader("x-request-id", id);
  next();
}
