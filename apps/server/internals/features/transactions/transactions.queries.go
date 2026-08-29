package transactions

import "fmt"

const (
	GetPendingTransaction = `
		SELECT jsonb_build_object(
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
			'user', jsonb_build_object('id', COALESCE(t.user_id::text, '')),
			'course', jsonb_build_object('id', COALESCE(t.course_id::text, ''))
		)
		FROM transactions t
		WHERE t.user_id = $1 AND t.course_id = $2 AND t.status = 'pending' AND (t.created_at + INTERVAL '30 minutes') > CURRENT_TIMESTAMP
		ORDER BY t.created_at DESC LIMIT 1;
	`

	CreateTransaction = `
		WITH inserted_tx AS (
			INSERT INTO transactions (id, user_id, course_id, razorpay_order_id, amount, actual_price, offered_price, tax_percent, discount_amount, currency, status)
			VALUES ($1, $2, $3, $4, $5, $7, $8, $9, $10, 'INR', 'pending')
			RETURNING id, user_id, course_id, razorpay_order_id, razorpay_payment_id, amount, actual_price, offered_price, tax_percent, discount_amount, currency, status, error_description, confirmed_at, created_at
		),
		coupon_mapped AS (
			INSERT INTO transactions_coupons (transaction_id, coupon_id)
			SELECT id, $6::uuid FROM inserted_tx WHERE $6::uuid IS NOT NULL
		)
		SELECT jsonb_build_object(
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
			'user', jsonb_build_object('id', COALESCE(t.user_id::text, '')),
			'course', jsonb_build_object('id', COALESCE(t.course_id::text, ''))
		)
		FROM inserted_tx t;
	`

	MarkPaymentCaptured = `
		WITH updated_tx AS (
			UPDATE transactions
			SET status = 'success', razorpay_payment_id = $1, confirmed_at = CURRENT_TIMESTAMP
			WHERE razorpay_order_id = $2
			RETURNING id, user_id, course_id
		),
		webhook_marked AS (
			UPDATE webhook_events SET processed = true WHERE razorpay_event_id = $3
		),
		applied_coupon AS (
			SELECT tc.coupon_id FROM updated_tx utx
			JOIN transactions_coupons tc ON tc.transaction_id = utx.id
		),
		coupon_used AS (
			INSERT INTO coupon_usages (coupon_id, user_id, course_id)
			SELECT ac.coupon_id, utx.user_id, utx.course_id FROM updated_tx utx, applied_coupon ac
			ON CONFLICT DO NOTHING
			RETURNING coupon_id
		),
		coupon_bumped AS (
			UPDATE coupons SET usage_count = usage_count + 1
			WHERE id IN (SELECT coupon_id FROM coupon_used)
		),
		enrolled AS (
			INSERT INTO enrollments (user_id, course_id, revoked)
			SELECT user_id, course_id, false FROM updated_tx
			ON CONFLICT (user_id, course_id) DO UPDATE SET revoked = false
		),
		notified AS (
			INSERT INTO notifications (type, message, is_admin, is_tutor, is_student)
			SELECT 'purchase', COALESCE(u.email, 'A user') || ' purchased ' || COALESCE(c.title, 'a course'), true, false, false
			FROM updated_tx utx
			LEFT JOIN "users" u ON u.id = utx.user_id
			LEFT JOIN courses c ON c.id = utx.course_id
		)
		SELECT id FROM updated_tx;
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
			'webhook_processed', CASE WHEN status IN ('success', 'failed') THEN true ELSE false END,
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
				'total', COALESCE((SELECT COUNT(*) FROM transactions t LEFT JOIN courses c ON c.id = t.course_id %s), 0),
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
								'user', jsonb_build_object('id', t.user_id, 'name', COALESCE(u.name, ''), 'image', u.image),
								'course', jsonb_build_object('id', t.course_id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url),
								'coupon', CASE WHEN tc.coupon_id IS NOT NULL THEN jsonb_build_object('id', tc.coupon_id, 'code', COALESCE(cp.code, ''), 'discount_value', COALESCE(cp.discount_percent, 0)) ELSE jsonb_build_object('id', '', 'code', '', 'discount_value', 0) END
							) ORDER BY t.created_at DESC
						)
						FROM (
							SELECT t.*, u.name, u.image, c.title, c.image_url, tc.coupon_id, cp.code, cp.discount_percent
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
