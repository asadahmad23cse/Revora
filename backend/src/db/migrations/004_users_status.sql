-- User lifecycle: onboarded (landing / pending connection) vs active (inbound traffic seen)

ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(32);

UPDATE users SET status = 'onboarded' WHERE status IS NULL;

ALTER TABLE users ALTER COLUMN status SET DEFAULT 'onboarded';

ALTER TABLE users ALTER COLUMN status SET NOT NULL;

UPDATE users u
SET status = 'active'
WHERE EXISTS (SELECT 1 FROM messages m WHERE m.user_id = u.id LIMIT 1);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_status_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_status_check CHECK (status IN ('onboarded', 'active'));
  END IF;
END $$;

COMMENT ON COLUMN users.status IS 'onboarded: signup; active: inbound messages observed.';
