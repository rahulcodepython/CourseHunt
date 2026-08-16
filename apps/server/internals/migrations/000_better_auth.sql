BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Better-Auth schema ──
-- Table names are plural and ids are UUID to match the Kysely adapter config
-- (usePlural: true) and every downstream migration/repository in this repo.

CREATE TABLE "users" (
    "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"            TEXT NOT NULL,
    "email"           TEXT NOT NULL UNIQUE,
    "emailVerified"   BOOLEAN NOT NULL DEFAULT false,
    "image"           TEXT,
    "createdAt"       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt"       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "role"            TEXT,
    "banned"          BOOLEAN,
    "banReason"       TEXT,
    "banExpires"      TIMESTAMPTZ,
    "passwordChangedAt" TIMESTAMPTZ
);

CREATE TABLE "sessions" (
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

CREATE TABLE "accounts" (
    "id"                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "accountId"              TEXT NOT NULL,
    "providerId"             TEXT NOT NULL,
    "userId"                 UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "accessToken"            TEXT,
    "refreshToken"           TEXT,
    "idToken"                TEXT,
    "accessTokenExpiresAt"   TIMESTAMPTZ,
    "refreshTokenExpiresAt"  TIMESTAMPTZ,
    "scope"                  TEXT,
    "password"               TEXT,
    "createdAt"              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt"              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "verifications" (
    "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "identifier" TEXT NOT NULL,
    "value"      TEXT NOT NULL,
    "expiresAt"  TIMESTAMPTZ NOT NULL,
    "createdAt"  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt"  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Better-auth resolves the `jwks` model to the plural table name "jwkss"
-- under usePlural: true.
CREATE TABLE "jwkss" (
    "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "publicKey"  TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"  TIMESTAMPTZ,
    "alg"        TEXT,
    "crv"        TEXT
);

CREATE INDEX "sessions_userId_idx" ON "sessions" ("userId");

CREATE INDEX "accounts_userId_idx" ON "accounts" ("userId");

CREATE UNIQUE INDEX "accounts_providerId_accountId_idx" ON "accounts" ("providerId", "accountId");

CREATE INDEX "verifications_identifier_idx" ON "verifications" ("identifier");

COMMIT;
