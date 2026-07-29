CREATE TABLE IF NOT EXISTS coupon_usages (
    id        text PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id text NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id   text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    used_at   timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(coupon_id, user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user_id   ON coupon_usages(user_id);
