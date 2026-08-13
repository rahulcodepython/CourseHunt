-- 007: Commerce — coupons, transactions, webhook_events

BEGIN;

CREATE TABLE IF NOT EXISTS coupons (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code             TEXT NOT NULL UNIQUE,
    course_id        UUID REFERENCES courses(id) ON DELETE CASCADE,   -- null = global
    discount_percent DECIMAL(5,2) NOT NULL CONSTRAINT coupons_discount_check CHECK (discount_percent >= 0 AND discount_percent <= 100),
    max_usage        INTEGER NOT NULL DEFAULT 100,
    usage_count      INTEGER NOT NULL DEFAULT 0,
    expires_at       TIMESTAMPTZ NOT NULL,
    is_active        BOOLEAN DEFAULT true,
    created_by       UUID REFERENCES "users"(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT coupons_usage_check CHECK (usage_count >= 0 AND usage_count <= max_usage)
);

CREATE INDEX IF NOT EXISTS idx_coupons_code       ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_course_id  ON coupons(course_id);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON coupons(created_by);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active  ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at);

COMMIT;
