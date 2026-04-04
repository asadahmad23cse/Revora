-- Optional CRM link to `businesses` + contact email

ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses (id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads (business_id);
