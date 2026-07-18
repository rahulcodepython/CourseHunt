CREATE TABLE IF NOT EXISTS cart_items (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    course_id  text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    added_at   timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
