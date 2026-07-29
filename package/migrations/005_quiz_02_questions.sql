CREATE TABLE IF NOT EXISTS quiz_questions (
    id            text PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id       text NOT NULL REFERENCES quiz_metadata(id) ON DELETE CASCADE,
    question_type text CHECK (question_type IN ('single_choice','multi_choice','arrange','fill_blank')) NOT NULL,
    question_text text NOT NULL,
    points        INTEGER DEFAULT 1,
    fill_blank_hint text
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
