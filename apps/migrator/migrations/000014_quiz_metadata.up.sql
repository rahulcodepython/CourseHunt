CREATE TABLE IF NOT EXISTS quiz_metadata (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id          UUID NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
    title              TEXT NOT NULL,
    time_limit_seconds INTEGER DEFAULT 0 CONSTRAINT quiz_time_limit_check CHECK (time_limit_seconds >= 0),
    total_questions    INTEGER DEFAULT 0,
    pass_score_percent INTEGER DEFAULT 70 CONSTRAINT quiz_pass_score_check CHECK (pass_score_percent >= 0 AND pass_score_percent <= 100),
    created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
