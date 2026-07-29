CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
    id                  text PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id          text NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id         text NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_option_ids text[],
    arrange_order       INTEGER[],
    fill_text           text,
    is_skipped          boolean DEFAULT false,
    is_correct          boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt ON quiz_attempt_answers(attempt_id);
