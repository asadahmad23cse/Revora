import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../db/pool";
import { config } from "../config";
import { HttpError } from "../middlewares/httpError";
import { UserService } from "../services/user.service";

const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  business_name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(8).max(24),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

type TokenPayload = { userId: string; businessId: string };

function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
}

function isPgUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23505";
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        code: "validation_error",
        details: parsed.error.flatten(),
      });
      return;
    }
    const { email, password, business_name, phone } = parsed.data;
    const normalizedPhone = UserService.normalizePhone(phone);
    const password_hash = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const u = await client.query<{ id: string }>(
        `INSERT INTO auth_users (email, password_hash) VALUES ($1, $2) RETURNING id`,
        [email.toLowerCase(), password_hash],
      );
      const userId = u.rows[0]?.id;
      if (!userId) {
        throw new HttpError(500, "Registration failed", "register_failed");
      }
      const b = await client.query<{ id: string }>(
        `INSERT INTO businesses (name, owner_user_id, phone_number) VALUES ($1, $2, $3) RETURNING id`,
        [business_name, userId, normalizedPhone],
      );
      const businessId = b.rows[0]?.id;
      if (!businessId) {
        throw new HttpError(500, "Registration failed", "register_failed");
      }
      await client.query(
        `INSERT INTO users (phone_number, display_name, status, config)
         VALUES (
           $1, $2, 'onboarded',
           jsonb_build_object(
             'onboarding',
             jsonb_build_object('connection_pending', true, 'onboarded_at', to_jsonb(now()))
           )
         )
         ON CONFLICT (phone_number) DO UPDATE SET
           display_name = COALESCE(users.display_name, EXCLUDED.display_name)`,
        [normalizedPhone, business_name],
      );
      await client.query("COMMIT");
      const token = signToken({ userId, businessId });
      res.status(201).json({ token, businessId, userId });
    } catch (e) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      if (isPgUniqueViolation(e)) {
        res.status(409).json({ error: "Email already registered", code: "email_taken" });
        return;
      }
      next(e);
      return;
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        code: "validation_error",
        details: parsed.error.flatten(),
      });
      return;
    }
    const email = parsed.data.email.toLowerCase();
    const row = await pool.query<{ id: string; password_hash: string }>(
      `SELECT id, password_hash FROM auth_users WHERE email = $1`,
      [email],
    );
    const user = row.rows[0];
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
      res.status(401).json({ error: "Invalid email or password", code: "invalid_credentials" });
      return;
    }
    const biz = await pool.query<{ id: string }>(
      `SELECT id FROM businesses WHERE owner_user_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [user.id],
    );
    const businessId = biz.rows[0]?.id;
    if (!businessId) {
      res.status(403).json({
        error: "No business linked to this account",
        code: "no_business",
      });
      return;
    }
    const token = signToken({ userId: user.id, businessId });
    res.status(200).json({ token, businessId, userId: user.id });
  } catch (e) {
    next(e);
  }
}
