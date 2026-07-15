CREATE TABLE IF NOT EXISTS lesson_document_content (
    id        text PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id text NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
    content   text NOT NULL
);
