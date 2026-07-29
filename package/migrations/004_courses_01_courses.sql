-- 004: Courses, Chapters, Lessons, and Lesson Content tables

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

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
    subcategory_id        text REFERENCES categories(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_courses_title_trgm    ON courses USING gin (title gin_trgm_ops);
