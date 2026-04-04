-- Revora Phase 1 – Revenue Leak Detector
-- PostgreSQL (Supabase-compatible)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(32) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_phone_number_key UNIQUE (phone_number)
);

CREATE INDEX idx_users_config_gin ON users USING gin (config jsonb_path_ops);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  phone_number VARCHAR(32) NOT NULL,
  message_text TEXT,
  direction VARCHAR(16) NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  "timestamp" TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  wa_message_id VARCHAR(255),
  CONSTRAINT messages_wa_message_id_key UNIQUE (wa_message_id)
);

CREATE INDEX idx_messages_user_phone_time ON messages (user_id, phone_number, "timestamp" ASC);
CREATE INDEX idx_messages_user_time ON messages (user_id, "timestamp" ASC);
CREATE INDEX idx_messages_direction ON messages (user_id, direction);

CREATE TABLE response_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
  response_time_seconds INTEGER NOT NULL CHECK (response_time_seconds >= 0),
  is_delayed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT response_tracking_message_id_key UNIQUE (message_id)
);

CREATE INDEX idx_response_tracking_created ON response_tracking (created_at);

CREATE TABLE risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
  risk_type VARCHAR(64) NOT NULL,
  estimated_loss NUMERIC(14, 2) NOT NULL CHECK (estimated_loss >= 0),
  confidence NUMERIC(5, 4) NOT NULL DEFAULT 0.65
    CHECK (confidence >= 0 AND confidence <= 1),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT risk_events_message_id_key UNIQUE (message_id)
);

CREATE INDEX idx_risk_events_created ON risk_events (created_at);

COMMENT ON TABLE users IS 'Business / owner accounts (tenant), identified by WhatsApp business number.';
COMMENT ON TABLE messages IS 'All WhatsApp legs; phone_number is the counterparty (customer) for both directions.';
COMMENT ON TABLE response_tracking IS 'First owner reply metrics for a specific incoming customer message.';
COMMENT ON TABLE risk_events IS 'Leak signals; copy uses at-risk language only (never confirmed lost revenue).';
