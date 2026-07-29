-- 005: Quiz tables

CREATE TABLE IF NOT EXISTS quiz_metadata (
    id                text PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id         text NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
    title             text NOT NULL,
    time_limit_seconds INTEGER DEFAULT 0,
    total_questions   INTEGER DEFAULT 0,
    pass_score_percent INTEGER DEFAULT 70
);
