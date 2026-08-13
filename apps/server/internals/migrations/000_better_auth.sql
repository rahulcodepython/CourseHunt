BEGIN;

CREATE TABLE IF NOT EXISTS "users" (
    "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"              TEXT NOT NULL,
    "email"             TEXT NOT NULL UNIQUE,
    "emailVerified"     BOOLEAN NOT NULL DEFAULT false,
    "image"             TEXT,
    "createdAt"         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt"         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "banned"            BOOLEAN DEFAULT false,
    "banReason"         TEXT,
    "banExpires"        TIMESTAMPTZ,
    "createdBy"         UUID REFERENCES "users"("id")
);

-- Native sessions for Refresh Tokens
CREATE TABLE IF NOT EXISTS "sessions" (
    "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"           UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "refresh_token_hash" VARCHAR(255) NOT NULL UNIQUE,
    "family_id"         UUID DEFAULT gen_random_uuid() NOT NULL,
    "rotated_at"        TIMESTAMPTZ NULL,
    "expires_at"        TIMESTAMPTZ NOT NULL,
    "created_at"        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_sessions_user_id" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_refresh_hash" ON "sessions" ("refresh_token_hash");

-- Email/Password credentials
CREATE TABLE IF NOT EXISTS "credentials" (
    "user_id"           UUID PRIMARY KEY REFERENCES "users" ("id") ON DELETE CASCADE,
    "password_hash"     VARCHAR(255) NOT NULL,
    "password_changed_at" TIMESTAMPTZ DEFAULT NULL,
    "created_at"        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at"        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_name ON "users"(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON "users"(email);

COMMIT;
