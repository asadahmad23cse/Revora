ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);

COMMENT ON COLUMN users.display_name IS 'Owner / signup name from landing onboard flow.';
