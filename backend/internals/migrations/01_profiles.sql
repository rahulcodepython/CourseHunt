-- Profiles table to store additional user information without modifying Better-Auth's "user" table
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    zip TEXT,
    purchased_courses INTEGER DEFAULT 0,
    completed_courses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to create a profile automatically when a new user is created
CREATE OR REPLACE FUNCTION create_profile_for_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_profile ON "user";
CREATE TRIGGER trg_create_profile AFTER INSERT ON "user"
FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();
