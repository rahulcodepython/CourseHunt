CREATE TABLE IF NOT EXISTS chapters (
    id                     text PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id              text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    chapter_no             INTEGER NOT NULL,
    title                  text NOT NULL,
    total_lectures         INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    created_at             timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at             timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, chapter_no)
);

CREATE INDEX IF NOT EXISTS idx_chapters_course_id ON chapters(course_id);
