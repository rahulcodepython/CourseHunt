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
