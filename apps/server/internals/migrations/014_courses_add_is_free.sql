-- 014: Free courses
--
-- A course can be marked entirely free by its tutor/admin. Free courses
-- never accept coupons (enforced in the coupons service, not just here) and
-- skip the payment flow entirely via a dedicated free-enroll endpoint.

BEGIN;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false;

-- A free course has no price and can't be combined with a coupon.
UPDATE courses SET final_price = 0, coupon_allowed = false WHERE is_free = true;

COMMIT;
