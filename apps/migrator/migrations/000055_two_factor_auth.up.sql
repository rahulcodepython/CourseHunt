-- Adds better-auth's `twoFactor` plugin schema (TOTP + backup codes for
-- students who opt in to a second factor on top of email OTP / Google SSO).
-- Column/table shape matches the plugin's InferOptionSchema exactly — see
-- better-auth/dist/plugins/two-factor/index.d.mts `schema` block.

ALTER TABLE "users"
    ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "twoFactors" (
    "id"                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "secret"                   TEXT NOT NULL,
    "backupCodes"              TEXT NOT NULL,
    "userId"                   UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "verified"                 BOOLEAN NOT NULL DEFAULT true,
    "failedVerificationCount"  INTEGER NOT NULL DEFAULT 0,
    "lockedUntil"              TIMESTAMPTZ
);

CREATE INDEX "twoFactors_secret_idx" ON "twoFactors" ("secret");
CREATE INDEX "twoFactors_userId_idx" ON "twoFactors" ("userId");
