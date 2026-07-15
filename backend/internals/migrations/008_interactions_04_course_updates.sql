CREATE TABLE IF NOT EXISTS course_updates (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  text REFERENCES courses(id) ON DELETE CASCADE,  -- null = platform-wide
    created_by text REFERENCES "user"(id) ON DELETE SET NULL,
    message    text NOT NULL,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_updates_course_id  ON course_updates(course_id);
CREATE INDEX IF NOT EXISTS idx_course_updates_created_by ON course_updates(created_by);
CREATE INDEX IF NOT EXISTS idx_course_updates_created_at ON course_updates(created_at DESC);
