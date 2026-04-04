import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

type JwtBody = {
  userId?: unknown;
  businessId?: unknown;
};

function isUuidString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized", code: "unauthorized" });
      return;
    }
    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      res.status(401).json({ error: "Unauthorized", code: "unauthorized" });
      return;
    }
    const decoded = jwt.verify(token, config.jwtSecret) as JwtBody;
    const userId = decoded.userId;
    const businessId = decoded.businessId;
    if (!isUuidString(userId) || !isUuidString(businessId)) {
      res.status(401).json({ error: "Unauthorized", code: "unauthorized" });
      return;
    }
    req.userId = userId;
    req.businessId = businessId;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized", code: "unauthorized" });
  }
}
