-- 008: Interactions — discussions, notes, feedbacks, updates, certificates, wishlist, cart

CREATE TABLE IF NOT EXISTS discussions (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id  text NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id  text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id    text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    parent_id  text REFERENCES discussions(id) ON DELETE CASCADE,
    content    text NOT NULL,
    reply_count INTEGER DEFAULT 0,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discussions_lesson_parent ON discussions(lesson_id, parent_id);
