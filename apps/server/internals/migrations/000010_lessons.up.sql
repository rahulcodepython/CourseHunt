CREATE TABLE IF NOT EXISTS lessons (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id          UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    lesson_no           INTEGER NOT NULL CONSTRAINT lessons_number_check CHECK (lesson_no > 0),
    title               TEXT NOT NULL,
    lesson_type         TEXT CHECK (lesson_type IN ('video','document','quiz')) NOT NULL DEFAULT 'video',
    short_description   TEXT,
    preview_video_url   TEXT,
    duration_seconds    INTEGER DEFAULT 0 CONSTRAINT lessons_duration_check CHECK (duration_seconds >= 0),
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chapter_id, lesson_no)
);

CREATE INDEX IF NOT EXISTS idx_lessons_chapter_id ON lessons(chapter_id);
