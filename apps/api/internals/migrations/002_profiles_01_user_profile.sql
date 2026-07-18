-- 002: User profile tables

CREATE TABLE IF NOT EXISTS user_profile (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    text NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    headline   text,
    bio        text,
    website    text,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profile_user_id  ON user_profile(user_id);
