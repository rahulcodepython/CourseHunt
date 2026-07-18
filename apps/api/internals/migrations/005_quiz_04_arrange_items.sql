CREATE TABLE IF NOT EXISTS quiz_arrange_items (
    id           text PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id  text NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    item_text    text NOT NULL,
    correct_order INTEGER NOT NULL
);
