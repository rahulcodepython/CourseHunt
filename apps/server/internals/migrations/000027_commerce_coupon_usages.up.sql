CREATE TABLE IF NOT EXISTS coupon_usages (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    used_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(coupon_id, user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user_id   ON coupon_usages(user_id);
