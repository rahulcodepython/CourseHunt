CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "users" (
    "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"              TEXT NOT NULL,
    "email"             TEXT NOT NULL UNIQUE,
    "emailVerified"     BOOLEAN NOT NULL DEFAULT false,
    "image"             TEXT,
    "createdAt"         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt"         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "role"              TEXT NOT NULL DEFAULT 'user',
    "banned"            BOOLEAN DEFAULT false,
    "banReason"         TEXT,
    "banExpires"        TIMESTAMPTZ,
    "passwordChangedAt" TIMESTAMPTZ,
    "twoFactorEnabled"  BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
CREATE INDEX IF NOT EXISTS "idx_users_banned" ON "users"("banned");
CREATE INDEX IF NOT EXISTS "idx_users_created_at" ON "users"("createdAt" DESC);

CREATE TABLE IF NOT EXISTS "sessions" (
    "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "expiresAt"      TIMESTAMPTZ NOT NULL,
    "token"          TEXT NOT NULL UNIQUE,
    "createdAt"      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt"      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ipAddress"      TEXT,
    "userAgent"      TEXT,
    "userId"         UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "impersonatedBy" TEXT
);

CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions" ("userId");
CREATE INDEX IF NOT EXISTS "idx_sessions_token" ON "sessions" ("token");

CREATE TABLE IF NOT EXISTS "accounts" (
    "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "accountId"             TEXT NOT NULL,
    "providerId"            TEXT NOT NULL,
    "userId"                UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "accessToken"           TEXT,
    "refreshToken"          TEXT,
    "idToken"               TEXT,
    "accessTokenExpiresAt"  TIMESTAMPTZ,
    "refreshTokenExpiresAt" TIMESTAMPTZ,
    "scope"                 TEXT,
    "password"              TEXT,
    "createdAt"             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt"             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "accounts_userId_idx" ON "accounts" ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_providerId_accountId_idx" ON "accounts" ("providerId", "accountId");

CREATE TABLE IF NOT EXISTS "verifications" (
    "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "identifier" TEXT NOT NULL,
    "value"      TEXT NOT NULL,
    "expiresAt"  TIMESTAMPTZ NOT NULL,
    "createdAt"  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt"  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "verifications_identifier_idx" ON "verifications" ("identifier");

CREATE TABLE IF NOT EXISTS "jwkss" (
    "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "publicKey"  TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"  TIMESTAMPTZ,
    "alg"        TEXT,
    "crv"        TEXT
);

CREATE TABLE IF NOT EXISTS "twoFactors" (
    "id"                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "secret"                  TEXT NOT NULL,
    "backupCodes"             TEXT NOT NULL,
    "userId"                  UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "verified"                BOOLEAN NOT NULL DEFAULT true,
    "failedVerificationCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil"             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "twoFactors_secret_idx" ON "twoFactors" ("secret");
CREATE INDEX IF NOT EXISTS "twoFactors_userId_idx" ON "twoFactors" ("userId");

CREATE TABLE IF NOT EXISTS "profiles" (
    "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"        UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "headline"       TEXT,
    "bio"            TEXT,
    "website"        TEXT,
    "total_students" INTEGER DEFAULT 0,
    "rating_avg"     DECIMAL(3,2) DEFAULT 0,
    "created_at"     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_profiles_user_id" ON "profiles"("user_id");
