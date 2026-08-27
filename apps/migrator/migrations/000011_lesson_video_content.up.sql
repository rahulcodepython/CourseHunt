CREATE TABLE IF NOT EXISTS lesson_video_content (
    lesson_id       UUID PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
    video_url       TEXT NOT NULL,
    written_content TEXT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
