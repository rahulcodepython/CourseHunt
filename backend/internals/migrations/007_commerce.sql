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

CREATE TABLE IF NOT EXISTS transactions (
    id                  text PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             text REFERENCES "user"(id) ON DELETE SET NULL,
    course_id           text REFERENCES courses(id) ON DELETE SET NULL,
    coupon_id           text REFERENCES coupons(id) ON DELETE SET NULL,
    razorpay_order_id   text UNIQUE,
    razorpay_payment_id text,
    amount              DECIMAL(10,2) NOT NULL,
    currency            text DEFAULT 'INR',
    status              text CHECK (status IN ('pending','success','failed')) DEFAULT 'pending',
    error_description   text,
    confirmed_at        timestamptz,
    created_at          timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id             ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_course_id           ON transactions(course_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status              ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_order_id   ON transactions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_payment_id ON transactions(razorpay_payment_id);

CREATE TABLE IF NOT EXISTS webhook_events (
    id                text PRIMARY KEY DEFAULT gen_random_uuid(),
    razorpay_event_id text NOT NULL UNIQUE,
    event_type        text NOT NULL,
    payload           JSONB,
    processed         boolean DEFAULT false,
    received_at       timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id  ON webhook_events(razorpay_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
