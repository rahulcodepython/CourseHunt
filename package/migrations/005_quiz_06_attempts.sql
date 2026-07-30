BEGIN;

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id         UUID NOT NULL REFERENCES quiz_metadata(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    submitted_at    TIMESTAMPTZ,
    total_score     DECIMAL(5,2) CONSTRAINT quiz_score_check CHECK (total_score >= 0),
    passed          BOOLEAN,
    correct_count   INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    skipped_count   INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_user ON quiz_attempts(quiz_id, user_id);

COMMIT;
