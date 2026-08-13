BEGIN;

CREATE TABLE IF NOT EXISTS wishlists (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    added_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);

COMMIT;
