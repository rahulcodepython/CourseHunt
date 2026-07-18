-- 006: Progress & Enrollment tables

CREATE TABLE IF NOT EXISTS enrollments (
    id                    text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    course_id             text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completion_percent    DECIMAL(5,2) DEFAULT 0,
    completed             boolean DEFAULT false,
    last_accessed_lesson_id text REFERENCES lessons(id) ON DELETE SET NULL,
    revoked               boolean DEFAULT false,
    enrolled_at           timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id   ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_revoked   ON enrollments(revoked);
