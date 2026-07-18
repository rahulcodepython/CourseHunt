CREATE TABLE IF NOT EXISTS quiz_options (
    id          text PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id text NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    is_correct  boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON quiz_options(question_id);
