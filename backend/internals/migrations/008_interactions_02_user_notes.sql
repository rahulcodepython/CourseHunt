CREATE TABLE IF NOT EXISTS user_notes (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    lesson_id  text NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id  text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    content    text NOT NULL,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notes_user_course ON user_notes(user_id, course_id);
