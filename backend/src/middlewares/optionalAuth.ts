import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

type JwtBody = {
  userId?: unknown;
  businessId?: unknown;
};

/** If a valid Bearer JWT is present, sets `req.userId` and `req.businessId`. Otherwise continues without error (for public routes with optional tenant context). */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    next();
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtBody;
    if (typeof decoded.userId === "string" && typeof decoded.businessId === "string") {
      req.userId = decoded.userId;
      req.businessId = decoded.businessId;
    }
  } catch {
    /* invalid or expired token — treat as anonymous for onboarding */
  }
  next();
}
