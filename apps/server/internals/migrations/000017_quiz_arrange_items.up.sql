CREATE TABLE IF NOT EXISTS quiz_arrange_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id   UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    item_text     TEXT NOT NULL,
    correct_order INTEGER NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quiz_arrange_items_question_id ON quiz_arrange_items(question_id);
