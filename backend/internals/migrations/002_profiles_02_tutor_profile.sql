CREATE TABLE IF NOT EXISTS tutor_profile (
    id             text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        text NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    headline       text,
    bio            text,
    website        text,
    total_students INTEGER DEFAULT 0,
    rating_avg     DECIMAL(3,2) DEFAULT 0,
    created_at     timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at     timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutor_profile_user_id ON tutor_profile(user_id);

-- Trigger: auto-create user_profile on new user
CREATE OR REPLACE FUNCTION create_user_profile_on_insert() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profile(user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_user_profile ON "user";
CREATE TRIGGER trg_create_user_profile
    AFTER INSERT ON "user"
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_on_insert();
