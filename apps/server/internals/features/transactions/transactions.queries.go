package transactions

import "fmt"

const (
	InitiateClaim = `
		WITH enrollment_check AS (
			SELECT EXISTS (
				SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 AND revoked = false
			) AS already_enrolled
		),
		expired AS (
			UPDATE transactions
			SET status = 'failed', error_description = 'expired: superseded by a new purchase attempt'
			WHERE user_id = $1 AND course_id = $2 AND status = 'pending'
			  AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 hour'
			RETURNING 1
		),
		expire_barrier AS (
			SELECT count(*) FROM expired
		),
		claimed AS (
			INSERT INTO transactions (id, user_id, course_id, amount, actual_price, offered_price, tax_percent, discount_amount, currency, status)
			SELECT $3, $1, $2, 0, 0, 0, 0, 0, 'INR', 'pending'
			FROM enrollment_check, expire_barrier
			WHERE NOT enrollment_check.already_enrolled
			ON CONFLICT (user_id, course_id) WHERE status = 'pending' DO NOTHING
			RETURNING id
		)
		SELECT
			(SELECT already_enrolled FROM enrollment_check) AS already_enrolled,
			EXISTS (SELECT 1 FROM claimed) AS claimed;
	`

	FinalizeClaimedTransaction = `
		WITH updated_tx AS (
			UPDATE transactions
			SET razorpay_order_id = $2, amount = $3, actual_price = $4, offered_price = $5, tax_percent = $6, discount_amount = $7
			WHERE id = $1
			RETURNING id
		),
		coupon_mapped AS (
			INSERT INTO transactions_coupons (transaction_id, coupon_id)
			SELECT id, $8::uuid FROM updated_tx WHERE $8::uuid IS NOT NULL
		)
		SELECT id FROM updated_tx;
	`

	MarkTransactionFailed = `UPDATE transactions SET status = 'failed', error_description = $2 WHERE id = $1;`

	MarkPaymentCaptured = `
		WITH updated_tx AS (
			UPDATE transactions
			SET status = 'success', razorpay_payment_id = $1, confirmed_at = CURRENT_TIMESTAMP
			WHERE razorpay_order_id = $2
			RETURNING id, user_id, course_id, amount, currency, razorpay_payment_id
		),
		webhook_marked AS (
			UPDATE webhook_events SET processed = true WHERE razorpay_event_id = $3
		),
		enrolled AS (
			INSERT INTO enrollments (user_id, course_id, revoked)
			SELECT user_id, course_id, false FROM updated_tx
			ON CONFLICT (user_id, course_id) DO UPDATE SET revoked = false
			RETURNING (xmax = 0) AS is_new_enrollment
		),
		original_tx AS (
			SELECT t.id FROM transactions t, updated_tx utx
			WHERE t.user_id = utx.user_id AND t.course_id = utx.course_id
			  AND t.status = 'success' AND t.id != utx.id
			ORDER BY t.confirmed_at ASC LIMIT 1
		),
		marked_duplicate AS (
			UPDATE transactions SET status = 'duplicate'
			WHERE id = (SELECT id FROM updated_tx)
			  AND EXISTS (SELECT 1 FROM enrolled WHERE is_new_enrollment = false)
			RETURNING id
		),
		inserted_refund AS (
			INSERT INTO transaction_refunds (transaction_id, duplicate_of, user_id, course_id, amount, currency, reason, refund_status, razorpay_payment_id)
			SELECT utx.id, (SELECT id FROM original_tx), utx.user_id, utx.course_id, utx.amount, utx.currency, 'duplicate_payment', 'pending', utx.razorpay_payment_id
			FROM updated_tx utx, enrolled e
			WHERE e.is_new_enrollment = false
			RETURNING id
		),
		applied_coupon AS (
			SELECT tc.coupon_id FROM updated_tx utx
			JOIN transactions_coupons tc ON tc.transaction_id = utx.id
		),
		coupon_used AS (
			INSERT INTO coupon_usages (coupon_id, user_id, course_id)
			SELECT ac.coupon_id, utx.user_id, utx.course_id
			FROM updated_tx utx, applied_coupon ac
			WHERE NOT EXISTS (SELECT 1 FROM marked_duplicate)
			ON CONFLICT DO NOTHING
			RETURNING coupon_id
		),
		coupon_bumped AS (
			UPDATE coupons SET usage_count = usage_count + 1 WHERE id IN (SELECT coupon_id FROM coupon_used)
		),
		notified AS (
			INSERT INTO notifications (type, message, is_admin, is_tutor, is_student)
			SELECT
				CASE WHEN EXISTS (SELECT 1 FROM marked_duplicate) THEN 'duplicate_payment' ELSE 'purchase' END,
				CASE WHEN EXISTS (SELECT 1 FROM marked_duplicate)
					 THEN 'Duplicate payment detected and flagged for refund: ' || COALESCE(u.email, 'a user') || ' on ' || COALESCE(c.title, 'a course')
					 ELSE COALESCE(u.email, 'A user') || ' purchased ' || COALESCE(c.title, 'a course')
				END,
				true, false, false
			FROM updated_tx utx
			LEFT JOIN "users" u ON u.id = utx.user_id
			LEFT JOIN courses c ON c.id = utx.course_id
		)
		SELECT
			utx.id AS transaction_id,
			EXISTS(SELECT 1 FROM marked_duplicate) AS is_duplicate,
			COALESCE((SELECT id::text FROM inserted_refund), '') AS refund_id,
			utx.razorpay_payment_id
		FROM updated_tx utx, enrolled e;
	`

	MarkPaymentFailed = `
		WITH updated_tx AS (
			UPDATE transactions
			SET status = 'failed', error_description = $1
			WHERE razorpay_order_id = $2
			RETURNING id
		),
		webhook_marked AS (
			UPDATE webhook_events SET processed = true WHERE razorpay_event_id = $3
		)
		SELECT id FROM updated_tx;
	`

	MarkRefundPending = `UPDATE transaction_refunds SET refund_status = 'pending', razorpay_refund_id = $2 WHERE id = $1;`

	MarkRefundProcessed = `
		WITH updated_refund AS (
			UPDATE transaction_refunds
			SET refund_status = 'processed', refunded_at = CURRENT_TIMESTAMP
			WHERE (razorpay_refund_id IS NOT NULL AND razorpay_refund_id = $1)
			   OR (razorpay_payment_id IS NOT NULL AND razorpay_payment_id = $2)
			RETURNING id, transaction_id
		),
		updated_tx AS (
			UPDATE transactions
			SET status = 'refunded'
			WHERE id IN (SELECT transaction_id FROM updated_refund)
		),
		webhook_marked AS (
			UPDATE webhook_events SET processed = true WHERE razorpay_event_id = $3
		)
		SELECT id FROM updated_refund;
	`

	MarkRefundFailed = `UPDATE transaction_refunds SET refund_status = 'failed', error_description = $2 WHERE id = $1;`

	MarkRefundFailedByRazorpayID = `
		WITH updated_refund AS (
			UPDATE transaction_refunds
			SET refund_status = 'failed', error_description = 'Razorpay refund failed'
			WHERE razorpay_refund_id = $1
			RETURNING id
		),
		webhook_marked AS (
			UPDATE webhook_events SET processed = true WHERE razorpay_event_id = $2
		)
		SELECT id FROM updated_refund;
	`

	GetCoursePricing = `
		SELECT jsonb_build_object(
			'actual_price', actual_price,
			'final_price', final_price
		)
		FROM courses WHERE id = $1;
	`

	GetTransactionStatus = `
		SELECT jsonb_build_object(
			'id', id,
			'status', status,
			'error_description', error_description,
			'webhook_processed', CASE WHEN status IN ('success', 'failed', 'duplicate', 'refunded') THEN true ELSE false END,
			'razorpay_order_id', razorpay_order_id
		)
		FROM transactions
		WHERE id = $1 AND user_id = $2;
	`

	GetCheckoutCourse = `
		SELECT jsonb_build_object(
			'id', c.id,
			'title', c.title,
			'image_url', c.image_url,
			'actual_price', c.actual_price,
			'final_price', c.final_price,
			'is_free', c.is_free,
			'instructor', jsonb_build_object(
				'id', u.id,
				'name', COALESCE(u.name, ''),
				'image', u.image
			)
		)
		FROM courses c
		JOIN "users" u ON u.id = c.tutor_id
		WHERE c.id = $1;
	`

	UpsertWebhookEvent = `
		INSERT INTO webhook_events (razorpay_event_id, event_type, processed)
		VALUES ($1, $2, false)
		ON CONFLICT (razorpay_event_id) DO UPDATE SET event_type = webhook_events.event_type
		RETURNING processed;
	`

	MarkWebhookEventProcessed = `UPDATE webhook_events SET processed = true WHERE razorpay_event_id = $1;`
)

func BuildListTransactionsQuery(whereClause string, limitParam, offsetParam int) string {
	return fmt.Sprintf(`
		SELECT COALESCE(
			jsonb_build_object(
				'total', COALESCE((SELECT COUNT(*) FROM transactions t LEFT JOIN courses c ON c.id = t.course_id LEFT JOIN "users" u ON u.id = t.user_id %s), 0),
				'data', COALESCE(
					(
						SELECT jsonb_agg(
							jsonb_build_object(
								'id', t.id,
								'amount', t.amount,
								'actual_price', t.actual_price,
								'offered_price', t.offered_price,
								'tax_percent', t.tax_percent,
								'discount_amount', t.discount_amount,
								'currency', t.currency,
								'status', t.status,
								'razorpay_order_id', t.razorpay_order_id,
								'razorpay_payment_id', t.razorpay_payment_id,
								'error_description', t.error_description,
								'confirmed_at', t.confirmed_at,
								'created_at', t.created_at,
								'user', jsonb_build_object('id', t.user_id, 'name', COALESCE(u.name, ''), 'email', COALESCE(u.email, ''), 'image', u.image),
								'course', jsonb_build_object('id', t.course_id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url),
								'coupon', CASE WHEN tc.coupon_id IS NOT NULL THEN jsonb_build_object('id', tc.coupon_id, 'code', COALESCE(cp.code, ''), 'discount_value', COALESCE(cp.discount_percent, 0)) ELSE jsonb_build_object('id', '', 'code', '', 'discount_value', 0) END
							) ORDER BY t.created_at DESC
						)
						FROM (
							SELECT t.*, u.name, u.email, u.image, c.title, c.image_url, tc.coupon_id, cp.code, cp.discount_percent
							FROM transactions t
							LEFT JOIN "users" u ON u.id = t.user_id
							LEFT JOIN courses c ON c.id = t.course_id
							LEFT JOIN transactions_coupons tc ON tc.transaction_id = t.id
							LEFT JOIN coupons cp ON cp.id = tc.coupon_id
							%s
							ORDER BY t.created_at DESC
							LIMIT $%d OFFSET $%d
						) t
					), '[]'::jsonb
				)
			), '{}'::jsonb
		);
	`, whereClause, whereClause, limitParam, offsetParam)
}

func BuildListRefundsQuery(whereClause string, limitParam, offsetParam int) string {
	return fmt.Sprintf(`
		SELECT COALESCE(
			jsonb_build_object(
				'total', COALESCE((SELECT COUNT(*) FROM transaction_refunds r LEFT JOIN courses c ON c.id = r.course_id LEFT JOIN "users" u ON u.id = r.user_id %s), 0),
				'data', COALESCE(
					(
						SELECT jsonb_agg(
							jsonb_build_object(
								'id', r.id,
								'transaction_id', r.transaction_id,
								'duplicate_of', r.duplicate_of,
								'amount', r.amount,
								'currency', r.currency,
								'reason', r.reason,
								'refund_status', r.refund_status,
								'razorpay_refund_id', r.razorpay_refund_id,
								'razorpay_payment_id', r.razorpay_payment_id,
								'error_description', r.error_description,
								'created_at', r.created_at,
								'refunded_at', r.refunded_at,
								'user', jsonb_build_object('id', r.user_id, 'name', COALESCE(u.name, ''), 'email', COALESCE(u.email, ''), 'image', u.image),
								'course', jsonb_build_object('id', r.course_id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url)
							) ORDER BY r.created_at DESC
						)
						FROM (
							SELECT r.*, u.name, u.email, u.image, c.title, c.image_url
							FROM transaction_refunds r
							LEFT JOIN "users" u ON u.id = r.user_id
							LEFT JOIN courses c ON c.id = r.course_id
							%s
							ORDER BY r.created_at DESC
							LIMIT $%d OFFSET $%d
						) r
					), '[]'::jsonb
				)
			), '{}'::jsonb
		);
	`, whereClause, whereClause, limitParam, offsetParam)
}
