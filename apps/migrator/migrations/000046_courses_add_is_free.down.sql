-- Best-effort: the UPDATE above overwrote final_price/coupon_allowed for
-- any course already marked free — those original values aren't recoverable
-- from the current state. Dropping the column is the only clean reversal.
ALTER TABLE courses DROP COLUMN IF EXISTS is_free;
