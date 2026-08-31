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
CREATE INDEX IF NOT EXISTS idx_chapters_course_chapter ON chapters(course_id, chapter_no);

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
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_lesson ON lessons(chapter_id, lesson_no);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_lesson_type ON lessons(chapter_id, lesson_no) INCLUDE (lesson_type, title);

CREATE TABLE IF NOT EXISTS lesson_video_content (
    lesson_id       UUID PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
    video_url       TEXT NOT NULL,
    written_content TEXT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_video_lesson ON lesson_video_content(lesson_id);

CREATE TABLE IF NOT EXISTS lesson_document_content (
    lesson_id       UUID PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_document_lesson ON lesson_document_content(lesson_id);

CREATE TABLE IF NOT EXISTS lesson_resources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    file_url    TEXT NOT NULL,
    file_type   TEXT,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson ON lesson_resources(lesson_id);
