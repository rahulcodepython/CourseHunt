CREATE TABLE IF NOT EXISTS quiz_attempts (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id    text NOT NULL REFERENCES quiz_metadata(id) ON DELETE CASCADE,
    user_id    text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    started_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    submitted_at timestamptz,
    total_score DECIMAL(5,2),
    passed      boolean,
    correct_count   INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    skipped_count   INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_user ON quiz_attempts(quiz_id, user_id);
