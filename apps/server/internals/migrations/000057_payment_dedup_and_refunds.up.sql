-- Ensure clean partial unique index for pending transactions per user & course
DROP INDEX IF EXISTS uq_pending_tx_user_course;
CREATE UNIQUE INDEX IF NOT EXISTS ux_transactions_one_pending_per_user_course
    ON transactions (user_id, course_id) WHERE status = 'pending';

-- Dedicated table for all refunded and duplicate payment transactions
CREATE TABLE IF NOT EXISTS transaction_refunds (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id      UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    duplicate_of        UUID REFERENCES transactions(id) ON DELETE SET NULL,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
