CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS courses (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id              UUID REFERENCES "users"(id) ON DELETE SET NULL,
    slug                  TEXT NOT NULL UNIQUE,
    title                 TEXT NOT NULL,
    short_description     TEXT,
    long_description      TEXT,
    image_url             TEXT,
    preview_video_url     TEXT,
    language              TEXT DEFAULT 'English',
    level                 TEXT CHECK (level IN ('beginner','intermediate','advanced','all')) DEFAULT 'all',
    actual_price          DECIMAL(10,2) DEFAULT 0 CONSTRAINT courses_actual_price_check CHECK (actual_price >= 0),
    final_price           DECIMAL(10,2) DEFAULT 0 CONSTRAINT courses_final_price_check CHECK (final_price >= 0),
    benefits              TEXT[],
    requirements          TEXT[],
    category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
    coupon_allowed        BOOLEAN DEFAULT true,
    total_lectures        INTEGER DEFAULT 0 CONSTRAINT courses_lectures_check CHECK (total_lectures >= 0),
    total_duration_seconds INTEGER DEFAULT 0,
    rating_avg            DECIMAL(3,2) DEFAULT 0 CONSTRAINT courses_rating_check CHECK (rating_avg >= 0 AND rating_avg <= 5),
    feedback_count        INTEGER DEFAULT 0 CONSTRAINT courses_feedback_count_check CHECK (feedback_count >= 0),
    status                TEXT CHECK (status IN ('draft','published','archived')) DEFAULT 'draft',
    created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT courses_price_consistency CHECK (final_price <= actual_price)
);

CREATE INDEX IF NOT EXISTS idx_courses_tutor_id      ON courses(tutor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status        ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category_id   ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug          ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_title_trgm    ON courses USING gin (title gin_trgm_ops);
