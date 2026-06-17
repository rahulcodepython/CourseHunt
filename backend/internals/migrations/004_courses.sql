-- 004: Courses, Chapters, Lessons, and Lesson Content tables

CREATE TABLE IF NOT EXISTS courses (
    id                    text PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id              text REFERENCES "user"(id) ON DELETE SET NULL,
    slug                  text NOT NULL UNIQUE,
    title                 text NOT NULL,
    short_description     text,
    long_description      text,
    image_url             text,
    preview_video_url     text,
    language              text DEFAULT 'English',
    level                 text CHECK (level IN ('beginner','intermediate','advanced','all')) DEFAULT 'all',
    actual_price          DECIMAL(10,2) DEFAULT 0,
    final_price           DECIMAL(10,2) DEFAULT 0,
    benefits              text[],
    requirements          text[],
    category_id           text REFERENCES categories(id) ON DELETE SET NULL,
    subcategory_id        text REFERENCES subcategories(id) ON DELETE SET NULL,
    coupon_allowed        boolean DEFAULT true,
    total_lectures        INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    rating_avg            DECIMAL(3,2) DEFAULT 0,
    feedback_count        INTEGER DEFAULT 0,
    status                text CHECK (status IN ('draft','published','archived')) DEFAULT 'draft',
    created_at            timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at            timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_tutor_id      ON courses(tutor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status        ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category_id   ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_subcategory_id ON courses(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug          ON courses(slug);

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

CREATE TABLE IF NOT EXISTS lesson_video_content (
    id              text PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id       text NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
    video_url       text NOT NULL,
    written_content text
);

CREATE TABLE IF NOT EXISTS lesson_document_content (
    id        text PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id text NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
    content   text NOT NULL
);

CREATE TABLE IF NOT EXISTS lesson_resources (
    id        text PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id text NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title     text NOT NULL,
    file_url  text NOT NULL,
    file_type text
);

CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson_id ON lesson_resources(lesson_id);
