CREATE TABLE IF NOT EXISTS lesson_resources (
    id        text PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id text NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title     text NOT NULL,
    file_url  text NOT NULL,
    file_type text
);

CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson_id ON lesson_resources(lesson_id);
