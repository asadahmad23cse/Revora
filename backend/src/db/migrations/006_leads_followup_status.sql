-- Follow-up scheduling + extended conversion statuses

ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS followup_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_status_check CHECK (
    status IN (
      'new',
      'contacted',
      'onboarded',
      'interested',
      'trial',
      'active',
      'dropped'
    )
  );

COMMENT ON COLUMN leads.last_contacted_at IS 'Last time an operator logged contact (POST /api/leads/:id/followup).';
COMMENT ON COLUMN leads.next_followup_at IS 'When the lead is due for follow-up (scanner + manual bump).';
COMMENT ON COLUMN leads.followup_count IS 'Number of times the auto follow-up scanner fired for this lead.';
