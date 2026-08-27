ALTER TABLE transactions
    DROP COLUMN IF EXISTS discount_amount,
    DROP COLUMN IF EXISTS tax_percent,
    DROP COLUMN IF EXISTS offered_price,
    DROP COLUMN IF EXISTS actual_price;
