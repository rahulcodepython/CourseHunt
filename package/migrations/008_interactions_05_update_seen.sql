CREATE TABLE IF NOT EXISTS update_seen (
    id        text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    update_id text NOT NULL REFERENCES course_updates(id) ON DELETE CASCADE,
    seen_at   timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, update_id)
);
