BEGIN;

-- 1. Single Choice Answers
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

-- 2. Multi Choice Answers (parent + junction)
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

-- 3. Arrange Answers
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

-- 4. Fill Blank Answers
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

COMMIT;
