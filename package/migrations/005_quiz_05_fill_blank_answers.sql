CREATE TABLE IF NOT EXISTS quiz_fill_blank_answers (
    id          text PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id text NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer      text NOT NULL
);
