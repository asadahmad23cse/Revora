-- Per-tenant SaaS config (Phase 1 hardening)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_users_config_gin ON users USING gin (config jsonb_path_ops);

COMMENT ON COLUMN users.config IS 'JSON: { "aov_inr": number, "response_threshold_seconds": number, ... } — DB preferred over webhook headers.';
