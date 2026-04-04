/**
 * - `npm run migrate` — applies `src/db/migrations/*.sql` in order (additive).
 * - `npm run migrate:schema` — applies full `schema.sql` once (empty database).
 */
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { pool } from "./pool";
import { logger } from "../utils/logger";

function resolveMigrationsDir(): string | null {
  const candidates = [
    join(process.cwd(), "src", "db", "migrations"),
    join(process.cwd(), "dist", "db", "migrations"),
  ];
  return candidates.find((d) => existsSync(d)) ?? null;
}

export async function runSchemaBootstrap(): Promise<void> {
  const candidates = [
    join(process.cwd(), "src", "db", "schema.sql"),
    join(process.cwd(), "dist", "db", "schema.sql"),
    join(__dirname, "schema.sql"),
  ];
  const schemaPath = candidates.find((p) => existsSync(p));
  if (!schemaPath) {
    throw new Error(`schema.sql not found. Tried:\n${candidates.join("\n")}`);
  }
  const sql = readFileSync(schemaPath, "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    logger.info({ schemaPath }, "Bootstrap schema applied");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function runAdditiveMigrations(): Promise<void> {
  const dir = resolveMigrationsDir();
  if (!dir) {
    logger.warn("No migrations directory found — nothing to apply");
    return;
  }
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const file of files) {
      const sql = readFileSync(join(dir, file), "utf8");
      logger.info({ file }, "Applying migration");
      await client.query(sql);
    }
    await client.query("COMMIT");
    logger.info("Migrations completed");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  void (async () => {
    try {
      const cmd = process.argv[2];
      if (cmd === "schema") {
        await runSchemaBootstrap();
      } else {
        await runAdditiveMigrations();
      }
    } catch (e) {
      logger.error({ err: e }, "Migration runner failed");
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  })();
}
