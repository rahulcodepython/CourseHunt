CREATE TABLE IF NOT EXISTS coupons (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code             TEXT NOT NULL UNIQUE,
    course_id        UUID REFERENCES courses(id) ON DELETE CASCADE,
    discount_percent DECIMAL(5,2) NOT NULL CONSTRAINT coupons_discount_check CHECK (discount_percent >= 0 AND discount_percent <= 100),
    max_usage        INTEGER NOT NULL DEFAULT 100,
    usage_count      INTEGER NOT NULL DEFAULT 0,
    expires_at       TIMESTAMPTZ NOT NULL,
    is_active        BOOLEAN DEFAULT true,
    created_by       UUID REFERENCES "users"(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT coupons_usage_check CHECK (usage_count >= 0 AND usage_count <= max_usage)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_course_id ON coupons(course_id);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON coupons(created_by);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at);

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
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_usages_lookup ON coupon_usages(coupon_id, user_id, course_id);

CREATE TABLE IF NOT EXISTS transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES "users"(id) ON DELETE SET NULL,
    course_id           UUID REFERENCES courses(id) ON DELETE SET NULL,
    razorpay_order_id   TEXT UNIQUE,
    razorpay_payment_id TEXT,
    amount              DECIMAL(10,2) NOT NULL CONSTRAINT transactions_amount_check CHECK (amount >= 0),
    actual_price        DECIMAL(10,2) NOT NULL DEFAULT 0,
    offered_price       DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_percent         DECIMAL(5,2)  NOT NULL DEFAULT 0,
    discount_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency            TEXT DEFAULT 'INR',
    status              TEXT CHECK (status IN ('pending','success','failed','duplicate','refunded')) DEFAULT 'pending',
    error_description   TEXT,
    confirmed_at        TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ GENERATED ALWAYS AS (created_at + INTERVAL '1 hour') STORED,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_transactions_one_pending_per_user_course
    ON transactions (user_id, course_id) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_transactions_user_id             ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_course_id           ON transactions(course_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status              ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_order_id   ON transactions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_payment_id ON transactions(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created        ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_course_created      ON transactions(course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status_created      ON transactions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at          ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_status         ON transactions(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at_brin     ON transactions USING brin(created_at);

CREATE TABLE IF NOT EXISTS transactions_coupons (
    transaction_id UUID PRIMARY KEY REFERENCES transactions(id) ON DELETE CASCADE,
    coupon_id      UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    used_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_coupons_coupon_id ON transactions_coupons(coupon_id);

CREATE TABLE IF NOT EXISTS webhook_events (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razorpay_event_id TEXT NOT NULL UNIQUE,
    event_type        TEXT NOT NULL,
    payload           JSONB,
    processed         BOOLEAN DEFAULT false,
    received_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id  ON webhook_events(razorpay_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_razorpay ON webhook_events(razorpay_event_id);

CREATE TABLE IF NOT EXISTS transaction_refunds (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id      UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    duplicate_of        UUID REFERENCES transactions(id) ON DELETE SET NULL,
    user_id             UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    course_id           UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    amount              NUMERIC(10, 2) NOT NULL,
    currency            VARCHAR(10) NOT NULL DEFAULT 'INR',
    reason              TEXT NOT NULL DEFAULT 'duplicate_payment',
    refund_status       TEXT NOT NULL DEFAULT 'pending' CHECK (refund_status IN ('pending', 'processed', 'failed')),
    razorpay_refund_id  TEXT,
    razorpay_payment_id TEXT,
    error_description   TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    refunded_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_transaction_refunds_user_id ON transaction_refunds(user_id);
CREATE INDEX IF NOT EXISTS ix_transaction_refunds_course_id ON transaction_refunds(course_id);
CREATE INDEX IF NOT EXISTS ix_transaction_refunds_status ON transaction_refunds(refund_status);
CREATE INDEX IF NOT EXISTS ix_transaction_refunds_duplicate_of ON transaction_refunds(duplicate_of) WHERE duplicate_of IS NOT NULL;
