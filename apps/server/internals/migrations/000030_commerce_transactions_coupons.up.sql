CREATE TABLE IF NOT EXISTS transactions_coupons (
    transaction_id UUID PRIMARY KEY REFERENCES transactions(id) ON DELETE CASCADE,
    coupon_id      UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    used_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_coupons_coupon_id ON transactions_coupons(coupon_id);
