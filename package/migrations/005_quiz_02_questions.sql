BEGIN;

CREATE TABLE IF NOT EXISTS quiz_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id         UUID NOT NULL REFERENCES quiz_metadata(id) ON DELETE CASCADE,
    question_type   TEXT CHECK (question_type IN ('single_choice','multi_choice','arrange','fill_blank')) NOT NULL,
    question_text   TEXT NOT NULL,
    points          INTEGER DEFAULT 1 CONSTRAINT quiz_points_check CHECK (points > 0),
    fill_blank_hint TEXT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

COMMIT;
