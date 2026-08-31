DROP INDEX IF EXISTS uq_pending_tx_user_course;
ALTER TABLE transactions DROP COLUMN IF EXISTS expires_at;
