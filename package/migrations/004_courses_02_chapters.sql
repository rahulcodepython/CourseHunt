BEGIN;

CREATE TABLE IF NOT EXISTS chapters (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id              UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    chapter_no             INTEGER NOT NULL CONSTRAINT chapters_number_check CHECK (chapter_no > 0),
    title                  TEXT NOT NULL,
    total_lectures         INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, chapter_no)
);

CREATE INDEX IF NOT EXISTS idx_chapters_course_id ON chapters(course_id);

COMMIT;
