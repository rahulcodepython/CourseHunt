-- 007: Commerce — coupons, transactions, webhook_events

CREATE TABLE IF NOT EXISTS coupons (
    id               text PRIMARY KEY DEFAULT gen_random_uuid(),
    code             text NOT NULL UNIQUE,
    course_id        text REFERENCES courses(id) ON DELETE CASCADE,   -- null = global
    discount_percent DECIMAL(5,2) NOT NULL,
    max_usage        INTEGER NOT NULL DEFAULT 100,
    usage_count      INTEGER NOT NULL DEFAULT 0,
    expires_at       timestamptz NOT NULL,
    is_active        boolean DEFAULT true,
    created_by       text REFERENCES "user"(id) ON DELETE SET NULL,
    created_at       timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coupons_code       ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_course_id  ON coupons(course_id);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON coupons(created_by);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active  ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at);
