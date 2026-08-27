CREATE TABLE IF NOT EXISTS update_seen (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    update_id UUID NOT NULL REFERENCES updates(id) ON DELETE CASCADE,
    seen_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, update_id)
);

CREATE INDEX IF NOT EXISTS idx_update_seen_user_id ON update_seen(user_id);
CREATE INDEX IF NOT EXISTS idx_update_seen_update_id ON update_seen(update_id);
