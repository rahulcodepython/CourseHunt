DROP INDEX IF EXISTS "twoFactors_userId_idx";
DROP INDEX IF EXISTS "twoFactors_secret_idx";
DROP TABLE IF EXISTS "twoFactors";
ALTER TABLE "users" DROP COLUMN IF EXISTS "twoFactorEnabled";
