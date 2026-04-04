CREATE TABLE IF NOT EXISTS lead_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'sent (simulated)',
  source VARCHAR(32) NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'ai_generated', 'worker_auto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_messages_lead_id ON lead_messages (lead_id, created_at DESC);
