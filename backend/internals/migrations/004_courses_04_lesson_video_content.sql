CREATE TABLE IF NOT EXISTS lesson_video_content (
    id              text PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id       text NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
    video_url       text NOT NULL,
    written_content text
);
