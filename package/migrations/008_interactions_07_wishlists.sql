CREATE TABLE IF NOT EXISTS wishlists (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    course_id  text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    added_at   timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
