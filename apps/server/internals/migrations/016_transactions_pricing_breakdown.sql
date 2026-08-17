-- 016: Snapshot the price breakdown on each transaction at purchase time, so
-- invoices stay accurate even if the course's price or the platform's tax
-- rate changes later. `amount` already holds the final tax-inclusive,
-- post-discount total actually charged.

BEGIN;

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS actual_price    DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS offered_price   DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_percent     DECIMAL(5,2)  NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0;

COMMIT;
