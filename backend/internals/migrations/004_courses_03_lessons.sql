CREATE TABLE IF NOT EXISTS lessons (
    id                  text PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id          text NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    lesson_no           INTEGER NOT NULL,
    title               text NOT NULL,
    lesson_type         text CHECK (lesson_type IN ('video','document','quiz')) NOT NULL DEFAULT 'video',
    short_description   text,
    preview_video_url   text,
    duration_seconds    INTEGER DEFAULT 0,
    created_at          timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chapter_id, lesson_no)
);

CREATE INDEX IF NOT EXISTS idx_lessons_chapter_id ON lessons(chapter_id);
