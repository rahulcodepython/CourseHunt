ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ
  GENERATED ALWAYS AS (created_at + INTERVAL '30 minutes') STORED;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_tx_user_course
  ON transactions (user_id, course_id)
  WHERE status = 'pending' AND expires_at > CURRENT_TIMESTAMP;
