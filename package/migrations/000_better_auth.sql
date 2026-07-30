CREATE TABLE IF NOT EXISTS "user" (
    "id"                text not null primary key,
    "name"              text not null,
    "email"             text not null unique,
    "emailVerified"     boolean not null default false,
    "image"             text,
    "createdAt"         timestamptz default CURRENT_TIMESTAMP not null,
    "updatedAt"         timestamptz default CURRENT_TIMESTAMP not null,
    "banned"            boolean default false,
    "banReason"         text,
    "banExpires"        timestamptz,
    "createdBy"         text references "user"("id")
);

-- Native sessions for Refresh Tokens
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
    "refresh_token_hash" VARCHAR(255) NOT NULL UNIQUE,
    "family_id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "rotated_at" TIMESTAMPTZ NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_sessions_user_id" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_refresh_hash" ON "sessions" ("refresh_token_hash");

-- OAuth provider linkages (e.g. Google)
CREATE TABLE IF NOT EXISTS "providers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
    "provider" VARCHAR(50) NOT NULL,
    "provider_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE("provider", "provider_id")
);

CREATE INDEX IF NOT EXISTS "idx_providers_user_id" ON "providers" ("user_id");

-- Email/Password credentials
CREATE TABLE IF NOT EXISTS "credentials" (
    "user_id" TEXT PRIMARY KEY REFERENCES "user" ("id") ON DELETE CASCADE,
    "password_hash" VARCHAR(255) NOT NULL,
    "password_changed_at" TIMESTAMPTZ DEFAULT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_name ON "user"(name);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
