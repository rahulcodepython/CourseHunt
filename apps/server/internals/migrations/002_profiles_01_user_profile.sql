-- 002: Unified Profile Table

BEGIN;

CREATE TABLE IF NOT EXISTS profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES "users"(id) ON DELETE CASCADE,
    headline        TEXT,
    bio             TEXT,
    website         TEXT,
    total_students  INTEGER DEFAULT 0,
    rating_avg      DECIMAL(3,2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

COMMIT;
