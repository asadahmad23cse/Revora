-- Early-user acquisition + CRM lite
-- Idempotent: `schema.sql` (migrate:schema) may already create `leads` with newer columns.

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(32) NOT NULL,
  source VARCHAR(32) NOT NULL CHECK (source IN ('instagram', 'whatsapp', 'manual')),
  status VARCHAR(32) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'onboarded', 'active')),
  intent_tag VARCHAR(32) CHECK (intent_tag IS NULL OR intent_tag IN ('high_intent', 'low_intent')),
  notes TEXT,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT leads_phone_number_key UNIQUE (phone_number)
);

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads (user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);

COMMENT ON TABLE leads IS 'Inbound acquisition; one row per phone; synced to users on /api/onboard.';
