BEGIN;

CREATE TABLE IF NOT EXISTS transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES "users"(id) ON DELETE SET NULL,
    course_id           UUID REFERENCES courses(id) ON DELETE SET NULL,
    coupon_id           UUID REFERENCES coupons(id) ON DELETE SET NULL,
    razorpay_order_id   TEXT UNIQUE,
    razorpay_payment_id TEXT,
    amount              DECIMAL(10,2) NOT NULL CONSTRAINT transactions_amount_check CHECK (amount >= 0),
    currency            TEXT DEFAULT 'INR',
    status              TEXT CHECK (status IN ('pending','success','failed')) DEFAULT 'pending',
    error_description   TEXT,
    confirmed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id             ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_course_id           ON transactions(course_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status              ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_order_id   ON transactions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_payment_id ON transactions(razorpay_payment_id);

COMMIT;
