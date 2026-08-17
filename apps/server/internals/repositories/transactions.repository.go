package repositories

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type TransactionsRepository struct {
	DB *sqlx.DB
}

func NewTransactionsRepository(db *sqlx.DB) *TransactionsRepository {
	return &TransactionsRepository{DB: db}
}

// ── Writes ──

// CreateRepository writes the transaction row ONCE, fully formed: the
// service creates the Razorpay order first, and only reaches here once that
// succeeds, so there's no "pending, no order id" row to reconcile later. The
// applied coupon (if any) is recorded as a separate transactions_coupons row
// in the same statement via a CTE.
func (r *TransactionsRepository) CreateRepository(id, userID, courseID string, couponID *string, razorpayOrderID string, amount, actualPrice, offeredPrice, taxPercent, discountAmount float64) (*entities.Transaction, error) {
	var t entities.Transaction
	err := r.DB.Get(&t, `
		WITH inserted_tx AS (
			INSERT INTO transactions (id, user_id, course_id, razorpay_order_id, amount, actual_price, offered_price, tax_percent, discount_amount, currency, status)
			VALUES ($1, $2, $3, $4, $5, $7, $8, $9, $10, 'INR', 'pending')
			RETURNING id
		),
		coupon_mapped AS (
			INSERT INTO transactions_coupons (transaction_id, coupon_id)
			SELECT id, $6::uuid FROM inserted_tx WHERE $6::uuid IS NOT NULL
		)
		SELECT
			id,
			COALESCE(user_id::text, '') AS "user.id",
			COALESCE(course_id::text, '') AS "course.id",
			razorpay_order_id, razorpay_payment_id, amount, actual_price, offered_price, tax_percent, discount_amount, currency, status,
			error_description, confirmed_at, created_at
		FROM transactions WHERE id = (SELECT id FROM inserted_tx)`,
		id, userID, courseID, razorpayOrderID, amount, couponID, actualPrice, offeredPrice, taxPercent, discountAmount,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// MarkPaymentCapturedRepository handles a successful "payment.captured"
// webhook in a single round trip: marks the transaction (found by Razorpay
// order id) successful, marks the webhook event processed, records coupon
// usage when a coupon was applied, and enrolls the user — all chained via
// CTEs off the same updated row, so the coupon/enrollment steps are correct
// no-ops when there's nothing to do (no coupon, transaction not found).
func (r *TransactionsRepository) MarkPaymentCapturedRepository(razorpayPaymentID, razorpayOrderID, eventID string) error {
	var txID string
	err := r.DB.Get(&txID, `
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
		)
		SELECT id FROM updated_tx`,
		razorpayPaymentID, razorpayOrderID, eventID,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return generic.ErrTransactionsNotFound
		}
		return err
	}
	return nil
}

// MarkPaymentFailedRepository handles a "payment.failed" webhook in a single
// round trip: marks the transaction (found by Razorpay order id) failed and
// marks the webhook event processed.
func (r *TransactionsRepository) MarkPaymentFailedRepository(errorDescription *string, razorpayOrderID, eventID string) error {
	var txID string
	err := r.DB.Get(&txID, `
		WITH updated_tx AS (
			UPDATE transactions
			SET status = 'failed', error_description = $1
			WHERE razorpay_order_id = $2
			RETURNING id
		),
		webhook_marked AS (
			UPDATE webhook_events SET processed = true WHERE razorpay_event_id = $3
		)
		SELECT id FROM updated_tx`,
		errorDescription, razorpayOrderID, eventID,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return generic.ErrTransactionsNotFound
		}
		return err
	}
	return nil
}

// ── Reads ──

func (r *TransactionsRepository) ListRepository(page, limit int, userID, tutorID, status, courseID, dateFrom, dateTo string) ([]entities.Transaction, int, error) {
	offset := (page - 1) * limit
	total := 0

	var args []any
	var whereClauses []string

	addFilter := func(clause string, val any) {
		args = append(args, val)
		whereClauses = append(whereClauses, fmt.Sprintf(clause, len(args)))
	}
	if userID != "" {
		addFilter("t.user_id = $%d", userID)
	}
	if tutorID != "" {
		addFilter("c.tutor_id = $%d", tutorID)
	}
	if status != "" {
		addFilter("t.status = $%d", status)
	}
	if courseID != "" {
		addFilter("t.course_id = $%d", courseID)
	}
	if dateFrom != "" {
		addFilter("t.created_at >= $%d", dateFrom)
	}
	if dateTo != "" {
		addFilter("t.created_at <= $%d", dateTo)
	}

	whereClause := ""
	if len(whereClauses) > 0 {
		whereClause = "WHERE " + whereClauses[0]
		for _, wc := range whereClauses[1:] {
			whereClause += " AND " + wc
		}
	}

	// Single query returns both the page of rows AND the total count via
	// COUNT(*) OVER(), and joins are done in SQL rather than N+1 fetches.
	query := `
		SELECT
			json_build_object(
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
				'user', json_build_object('id', t.user_id, 'name', COALESCE(u.name, ''), 'image', u.image),
				'course', json_build_object('id', t.course_id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url),
				'coupon', CASE WHEN tc.coupon_id IS NOT NULL THEN json_build_object('id', tc.coupon_id, 'code', COALESCE(cp.code, ''), 'discount_value', COALESCE(cp.discount_percent, 0)) ELSE json_build_object('id', '', 'code', '', 'discount_value', 0) END
			) AS data,
			COUNT(*) OVER() AS total_count
		FROM transactions t
		LEFT JOIN "users" u ON u.id = t.user_id
		LEFT JOIN courses c ON c.id = t.course_id
		LEFT JOIN transactions_coupons tc ON tc.transaction_id = t.id
		LEFT JOIN coupons cp ON cp.id = tc.coupon_id
		` + whereClause + `
		ORDER BY t.created_at DESC
		LIMIT $` + fmt.Sprint(len(args)+1) + ` OFFSET $` + fmt.Sprint(len(args)+2)

	args = append(args, limit, offset)

	var rows []struct {
		Data       []byte `db:"data"`
		TotalCount int    `db:"total_count"`
	}
	if err := r.DB.Select(&rows, query, args...); err != nil {
		return nil, 0, err
	}

	list := make([]entities.Transaction, 0, len(rows))
	for _, row := range rows {
		var tx entities.Transaction
		if err := json.Unmarshal(row.Data, &tx); err != nil {
			return nil, 0, err
		}
		list = append(list, tx)
		total = row.TotalCount
	}

	return list, total, nil
}

type CoursePricing struct {
	ActualPrice float64 `db:"actual_price"`
	FinalPrice  float64 `db:"final_price"`
}

func (r *TransactionsRepository) GetCoursePricingRepository(courseID string) (*CoursePricing, error) {
	var pricing CoursePricing
	err := r.DB.Get(&pricing, `SELECT actual_price, final_price FROM courses WHERE id = $1`, courseID)
	if err != nil {
		return nil, err
	}
	return &pricing, nil
}

func (r *TransactionsRepository) GetTransactionStatusRepository(txID, userID string) (*entities.TransactionStatusResponse, error) {
	var resp entities.TransactionStatusResponse
	err := r.DB.Get(&resp, `
		SELECT
			id,
			status,
			error_description,
			CASE WHEN status IN ('success', 'failed') THEN true ELSE false END AS webhook_processed,
			razorpay_order_id
		FROM transactions
		WHERE id = $1 AND user_id = $2`, txID, userID)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

func (r *TransactionsRepository) GetCheckoutCourseRepository(courseID string) (*entities.CheckoutCourseResponse, error) {
	var resp entities.CheckoutCourseResponse
	err := r.DB.Get(&resp, `
		SELECT
			c.id, c.title, c.image_url, c.actual_price, c.final_price, c.is_free,
			u.id AS "instructor.id",
			COALESCE(u.name, '') AS "instructor.name",
			u.image AS "instructor.image"
		FROM courses c
		JOIN "users" u ON u.id = c.tutor_id
		WHERE c.id = $1`, courseID)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// ── Webhook events ──

// UpsertWebhookEventRepository does a single INSERT ... ON CONFLICT DO
// UPDATE ... RETURNING processed, whether the event is new or a retry:
//   - New event: row is inserted as unprocessed, RETURNING gives back `false`.
//   - Retry (already logged, not yet processed - e.g. previous attempt
//     crashed mid-webhook): the DO UPDATE is a no-op write that still lets us
//     RETURNING the current `processed` value.
//   - Retry (already fully processed): RETURNING gives back `true`, caller
//     short-circuits.
func (r *TransactionsRepository) UpsertWebhookEventRepository(eventID, eventType string) (alreadyProcessed bool, err error) {
	err = r.DB.Get(&alreadyProcessed, `
		INSERT INTO webhook_events (razorpay_event_id, event_type, processed)
		VALUES ($1, $2, false)
		ON CONFLICT (razorpay_event_id) DO UPDATE SET event_type = webhook_events.event_type
		RETURNING processed`, eventID, eventType)
	return alreadyProcessed, err
}

// MarkWebhookEventProcessedRepository is kept only for event types the
// switch in HandleWebhookService doesn't otherwise handle (nothing to update
// on the transactions table, but we still need to close out the event so
// Razorpay stops retrying it). For "payment.captured" / "payment.failed" use
// MarkPaymentCapturedRepository / MarkPaymentFailedRepository instead.
func (r *TransactionsRepository) MarkWebhookEventProcessedRepository(eventID string) error {
	_, err := r.DB.Exec(`UPDATE webhook_events SET processed = true WHERE razorpay_event_id = $1`, eventID)
	return err
}
