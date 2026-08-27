CREATE TABLE IF NOT EXISTS updates (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  UUID REFERENCES courses(id) ON DELETE CASCADE,  -- null = platform-wide
    created_by UUID REFERENCES "users"(id) ON DELETE SET NULL,
    message    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_updates_course_id  ON updates(course_id);
CREATE INDEX IF NOT EXISTS idx_updates_created_by ON updates(created_by);
CREATE INDEX IF NOT EXISTS idx_updates_created_at ON updates(created_at DESC);
