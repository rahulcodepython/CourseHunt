BEGIN;

-- Align legacy (snake_case) Better-Auth tables to camelCase so the Kysely
-- adapter (usePlural: true, identity transform) works against existing databases.

DO $$
DECLARE
    col TEXT;
BEGIN
    -- sessions
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'sessions' AND column_name = 'user_id' LOOP
        EXECUTE 'ALTER TABLE sessions RENAME COLUMN "user_id" TO "userId"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'sessions' AND column_name = 'expires_at' LOOP
        EXECUTE 'ALTER TABLE sessions RENAME COLUMN "expires_at" TO "expiresAt"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'sessions' AND column_name = 'ip_address' LOOP
        EXECUTE 'ALTER TABLE sessions RENAME COLUMN "ip_address" TO "ipAddress"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'sessions' AND column_name = 'user_agent' LOOP
        EXECUTE 'ALTER TABLE sessions RENAME COLUMN "user_agent" TO "userAgent"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'sessions' AND column_name = 'created_at' LOOP
        EXECUTE 'ALTER TABLE sessions RENAME COLUMN "created_at" TO "createdAt"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'sessions' AND column_name = 'updated_at' LOOP
        EXECUTE 'ALTER TABLE sessions RENAME COLUMN "updated_at" TO "updatedAt"';
    END LOOP;

    -- accounts
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'accounts' AND column_name = 'user_id' LOOP
        EXECUTE 'ALTER TABLE accounts RENAME COLUMN "user_id" TO "userId"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'accounts' AND column_name = 'account_id' LOOP
        EXECUTE 'ALTER TABLE accounts RENAME COLUMN "account_id" TO "accountId"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'accounts' AND column_name = 'provider_id' LOOP
        EXECUTE 'ALTER TABLE accounts RENAME COLUMN "provider_id" TO "providerId"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'accounts' AND column_name = 'access_token' LOOP
        EXECUTE 'ALTER TABLE accounts RENAME COLUMN "access_token" TO "accessToken"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'accounts' AND column_name = 'refresh_token' LOOP
        EXECUTE 'ALTER TABLE accounts RENAME COLUMN "refresh_token" TO "refreshToken"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'accounts' AND column_name = 'expires_at' LOOP
        EXECUTE 'ALTER TABLE accounts RENAME COLUMN "expires_at" TO "accessTokenExpiresAt"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'accounts' AND column_name = 'created_at' LOOP
        EXECUTE 'ALTER TABLE accounts RENAME COLUMN "created_at" TO "createdAt"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'accounts' AND column_name = 'updated_at' LOOP
        EXECUTE 'ALTER TABLE accounts RENAME COLUMN "updated_at" TO "updatedAt"';
    END LOOP;

    -- verifications
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'verifications' AND column_name = 'expires_at' LOOP
        EXECUTE 'ALTER TABLE verifications RENAME COLUMN "expires_at" TO "expiresAt"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'verifications' AND column_name = 'created_at' LOOP
        EXECUTE 'ALTER TABLE verifications RENAME COLUMN "created_at" TO "createdAt"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'verifications' AND column_name = 'updated_at' LOOP
        EXECUTE 'ALTER TABLE verifications RENAME COLUMN "updated_at" TO "updatedAt"';
    END LOOP;

    -- jwks -> jwkss (better-auth resolves the `jwks` model to `jwkss` with usePlural: true)
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'jwks' AND column_name = 'public_key' LOOP
        EXECUTE 'ALTER TABLE jwks RENAME COLUMN "public_key" TO "publicKey"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'jwks' AND column_name = 'private_key' LOOP
        EXECUTE 'ALTER TABLE jwks RENAME COLUMN "private_key" TO "privateKey"';
    END LOOP;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = 'jwks' AND column_name = 'created_at' LOOP
        EXECUTE 'ALTER TABLE jwks RENAME COLUMN "created_at" TO "createdAt"';
    END LOOP;
END $$;

ALTER TABLE IF EXISTS jwks RENAME TO "jwkss";

-- Add columns that Better-Auth expects but the legacy schema lacked
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS "token" TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
UPDATE sessions SET "token" = gen_random_uuid()::text WHERE "token" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token ON sessions("token");
ALTER TABLE sessions ALTER COLUMN "token" SET NOT NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Drop legacy manual-auth session columns (refresh-token rotation) that are no
-- longer used by Better-Auth sessions
ALTER TABLE sessions DROP COLUMN IF EXISTS "refresh_token_hash";
ALTER TABLE sessions DROP COLUMN IF EXISTS "family_id";
ALTER TABLE sessions DROP COLUMN IF EXISTS "rotated_at";

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "idToken" TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "scope" TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "password" TEXT;

ALTER TABLE "jwkss" ADD COLUMN IF NOT EXISTS "alg" TEXT;
ALTER TABLE "jwkss" ADD COLUMN IF NOT EXISTS "crv" TEXT;
ALTER TABLE "jwkss" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMPTZ;

COMMIT;