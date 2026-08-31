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

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_metadata_lesson ON quiz_metadata(lesson_id);

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

CREATE TABLE IF NOT EXISTS quiz_options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct  BOOLEAN DEFAULT false,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question_correct ON quiz_options(question_id, is_correct);

CREATE TABLE IF NOT EXISTS quiz_arrange_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id   UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    item_text     TEXT NOT NULL,
    correct_order INTEGER NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quiz_arrange_items_question_id ON quiz_arrange_items(question_id);

CREATE TABLE IF NOT EXISTS quiz_fill_blank_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer      TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quiz_fill_blank_answers_question_id ON quiz_fill_blank_answers(question_id);

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

CREATE TABLE IF NOT EXISTS quiz_attempt_single_answers (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id         UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id        UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_option_id UUID NOT NULL REFERENCES quiz_options(id) ON DELETE CASCADE,
    is_correct         BOOLEAN DEFAULT false,
    is_skipped         BOOLEAN DEFAULT false,
    created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_single_answers_attempt ON quiz_attempt_single_answers(attempt_id);

CREATE TABLE IF NOT EXISTS quiz_attempt_multi_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id  UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    is_correct  BOOLEAN DEFAULT false,
    is_skipped  BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_multi_answers_attempt ON quiz_attempt_multi_answers(attempt_id);

CREATE TABLE IF NOT EXISTS quiz_attempt_multi_answer_options (
    multi_answer_id    UUID NOT NULL REFERENCES quiz_attempt_multi_answers(id) ON DELETE CASCADE,
    selected_option_id UUID NOT NULL REFERENCES quiz_options(id) ON DELETE CASCADE,
    PRIMARY KEY (multi_answer_id, selected_option_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempt_arrange_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id      UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id     UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    arrange_item_id UUID NOT NULL REFERENCES quiz_arrange_items(id) ON DELETE CASCADE,
    submitted_order INTEGER NOT NULL,
    is_correct      BOOLEAN DEFAULT false,
    is_skipped      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attempt_id, question_id, arrange_item_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_arrange_answers_attempt ON quiz_attempt_arrange_answers(attempt_id);

CREATE TABLE IF NOT EXISTS quiz_attempt_fill_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id  UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    fill_text   TEXT NOT NULL,
    is_correct  BOOLEAN DEFAULT false,
    is_skipped  BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_fill_answers_attempt ON quiz_attempt_fill_answers(attempt_id);

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
