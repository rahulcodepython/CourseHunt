-- 007_commerce_05: Transaction <-> Coupon usage mapping.
-- One row per transaction that had a coupon applied (transaction_id is the
-- PK, so at most one coupon per transaction — matching checkout, which
-- applies a single coupon code per purchase).

BEGIN;

CREATE TABLE IF NOT EXISTS transactions_coupons (
    transaction_id UUID PRIMARY KEY REFERENCES transactions(id) ON DELETE CASCADE,
    coupon_id      UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    used_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_coupons_coupon_id ON transactions_coupons(coupon_id);

COMMIT;
