import type { Request, Response, NextFunction } from "express";

/**
 * Captures exact JSON bytes for HMAC verification (`req.rawBody`) and replaces `req.body` with parsed JSON.
 */
export function captureRawJsonAndParse(req: Request, res: Response, next: NextFunction): void {
  const buf = req.body;
  if (!Buffer.isBuffer(buf)) {
    res.status(500).json({ error: "Expected raw buffer body on webhook route", code: "server_misconfig" });
    return;
  }
  req.rawBody = buf;
  try {
    const text = buf.length ? buf.toString("utf8") : "{}";
    req.body = text.trim() === "" ? {} : JSON.parse(text);
  } catch {
    res.status(400).json({ error: "Invalid JSON body", code: "invalid_json" });
    return;
  }
  next();
}
