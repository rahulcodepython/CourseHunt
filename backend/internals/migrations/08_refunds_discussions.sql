-- Add status to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'idle';

-- Add is_pinned to feedbacks
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    parent_id INTEGER REFERENCES discussions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
