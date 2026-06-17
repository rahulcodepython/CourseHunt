-- 005: Quiz tables

CREATE TABLE IF NOT EXISTS quiz_metadata (
    id                text PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id         text NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
    title             text NOT NULL,
    time_limit_seconds INTEGER DEFAULT 0,
    total_questions   INTEGER DEFAULT 0,
    pass_score_percent INTEGER DEFAULT 70
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id            text PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id       text NOT NULL REFERENCES quiz_metadata(id) ON DELETE CASCADE,
    question_type text CHECK (question_type IN ('single_choice','multi_choice','arrange','fill_blank')) NOT NULL,
    question_text text NOT NULL,
    points        INTEGER DEFAULT 1,
    fill_blank_hint text
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

CREATE TABLE IF NOT EXISTS quiz_options (
    id          text PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id text NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    is_correct  boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON quiz_options(question_id);

CREATE TABLE IF NOT EXISTS quiz_arrange_items (
    id           text PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id  text NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    item_text    text NOT NULL,
    correct_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_fill_blank_answers (
    id          text PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id text NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer      text NOT NULL
);

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

-- Trigger: update total_questions on quiz_metadata after question insert/delete
CREATE OR REPLACE FUNCTION update_quiz_question_count() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE quiz_metadata SET total_questions = total_questions + 1 WHERE id = NEW.quiz_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE quiz_metadata SET total_questions = GREATEST(total_questions - 1, 0) WHERE id = OLD.quiz_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quiz_question_count ON quiz_questions;
CREATE TRIGGER trg_quiz_question_count
    AFTER INSERT OR DELETE ON quiz_questions
    FOR EACH ROW EXECUTE FUNCTION update_quiz_question_count();
