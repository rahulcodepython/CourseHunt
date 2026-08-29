CREATE TABLE IF NOT EXISTS discussions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    parent_id   UUID REFERENCES discussions(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    reply_count INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discussions_lesson_parent ON discussions(lesson_id, parent_id);
