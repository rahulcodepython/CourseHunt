CREATE TABLE IF NOT EXISTS lesson_document_content (
    lesson_id       UUID PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
