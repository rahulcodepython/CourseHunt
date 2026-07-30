-- 006: Progress & Enrollment tables

BEGIN;

CREATE TABLE IF NOT EXISTS enrollments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    course_id               UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completion_percent      DECIMAL(5,2) DEFAULT 0 CONSTRAINT enrollments_completion_check CHECK (completion_percent >= 0 AND completion_percent <= 100),
    completed               BOOLEAN DEFAULT false,
    last_accessed_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    revoked                 BOOLEAN DEFAULT false,
    enrolled_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id   ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_revoked   ON enrollments(revoked);

COMMIT;
