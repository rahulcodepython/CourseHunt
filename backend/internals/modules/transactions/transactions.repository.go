package transactions

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// ── Shared scan target ──

const transactionColumns = `id, user_id, course_id, coupon_id, razorpay_order_id,
	razorpay_payment_id, amount, currency, status, error_description, confirmed_at, created_at`

type transactionRow struct {
	ID                string     `db:"id"`
	UserID            string     `db:"user_id"`
	CourseID          string     `db:"course_id"`
	CouponID          *string    `db:"coupon_id"`
	RazorpayOrderID   *string    `db:"razorpay_order_id"`
	RazorpayPaymentID *string    `db:"razorpay_payment_id"`
	Amount            float64    `db:"amount"`
	Currency          string     `db:"currency"`
	Status            string     `db:"status"`
	ErrorDescription  *string    `db:"error_description"`
	ConfirmedAt       *time.Time `db:"confirmed_at"`
	CreatedAt         time.Time  `db:"created_at"`
}

func (r transactionRow) toTransaction() Transaction {
	t := Transaction{
		ID:                r.ID,
		RazorpayOrderID:   r.RazorpayOrderID,
		RazorpayPaymentID: r.RazorpayPaymentID,
		Amount:            r.Amount,
		Currency:          r.Currency,
		Status:            r.Status,
		ErrorDescription:  r.ErrorDescription,
		ConfirmedAt:       r.ConfirmedAt,
		CreatedAt:         r.CreatedAt,
	}
	t.User.ID = r.UserID
	t.Course.ID = r.CourseID
	if r.CouponID != nil {
		t.Coupon.ID = *r.CouponID
	}
	return t
}

// ── Writes ──

func (m *TransactionsModule) CreateRepository(ctx context.Context, userID, courseID string, couponID *string, razorpayOrderID string, amount float64) (*Transaction, error) {
	var row transactionRow
	err := m.DB.GetContext(ctx, &row, `
		INSERT INTO transactions (user_id, course_id, coupon_id, razorpay_order_id, amount, currency, status)
		VALUES ($1, $2, $3, $4, $5, 'INR', 'pending')
		RETURNING `+transactionColumns,
		userID, courseID, couponID, razorpayOrderID, amount,
	)
	if err != nil {
		return nil, err
	}
	t := row.toTransaction()
	return &t, nil
}

func (m *TransactionsModule) UpdateRazorpayOrderIDRepository(ctx context.Context, id, razorpayOrderID string) error {
	_, err := m.DB.ExecContext(ctx, `UPDATE transactions SET razorpay_order_id = $1 WHERE id = $2`, razorpayOrderID, id)
	return err
}

// MarkOrderCreationFailedRepository marks a pending transaction as failed when
// Razorpay order creation fails after the local row was already inserted, so
// it doesn't get stuck as a dangling "pending" row with no order id.
func (m *TransactionsModule) MarkOrderCreationFailedRepository(ctx context.Context, id string) error {
	desc := "failed to create razorpay order"
	_, err := m.DB.ExecContext(ctx, `UPDATE transactions SET status = 'failed', error_description = $1 WHERE id = $2`, desc, id)
	return err
}

func (m *TransactionsModule) MarkSuccessRepository(ctx context.Context, id, razorpayPaymentID string) error {
	_, err := m.DB.ExecContext(ctx, `
		UPDATE transactions SET status = 'success', razorpay_payment_id = $1, confirmed_at = CURRENT_TIMESTAMP WHERE id = $2`,
		razorpayPaymentID, id)
	return err
}

func (m *TransactionsModule) MarkFailedRepository(ctx context.Context, id string, desc *string) error {
	_, err := m.DB.ExecContext(ctx, `UPDATE transactions SET status = 'failed', error_description = $1 WHERE id = $2`, desc, id)
	return err
}

// ── Reads ──

func (m *TransactionsModule) FindByRazorpayOrderIDRepository(ctx context.Context, orderID string) (*Transaction, error) {
	var row transactionRow
	err := m.DB.GetContext(ctx, &row, `SELECT `+transactionColumns+` FROM transactions WHERE razorpay_order_id = $1`, orderID)
	if err != nil {
		return nil, err
	}
	t := row.toTransaction()
	return &t, nil
}

func (m *TransactionsModule) ListRepository(ctx context.Context, page, limit int, userID string, tutorID string) ([]Transaction, int, error) {
	offset := (page - 1) * limit
	total := 0

	var args []interface{}
	var whereClauses []string

	addFilter := func(clause string, val interface{}) {
		args = append(args, val)
		whereClauses = append(whereClauses, fmt.Sprintf(clause, len(args)))
	}
	if userID != "" {
		addFilter("t.user_id = $%d", userID)
	}
	if tutorID != "" {
		addFilter("c.tutor_id = $%d", tutorID)
	}

	whereClause := ""
	if len(whereClauses) > 0 {
		whereClause = "WHERE " + whereClauses[0]
		for _, wc := range whereClauses[1:] {
			whereClause += " AND " + wc
		}
	}

	query := `
		SELECT 
			json_build_object(
				'id', t.id,
				'amount', t.amount,
				'currency', t.currency,
				'status', t.status,
				'razorpay_order_id', t.razorpay_order_id,
				'razorpay_payment_id', t.razorpay_payment_id,
				'error_description', t.error_description,
				'confirmed_at', t.confirmed_at,
				'created_at', t.created_at,
				'user', json_build_object('id', t.user_id, 'name', COALESCE(u.name, ''), 'image', u.image),
				'course', json_build_object('id', t.course_id, 'title', COALESCE(c.title, ''), 'thumbnail', c.thumbnail),
				'coupon', CASE WHEN t.coupon_id IS NOT NULL THEN json_build_object('id', t.coupon_id, 'code', COALESCE(cp.code, ''), 'discount_percent', COALESCE(cp.discount_percent, 0)) ELSE json_build_object('id', '', 'code', '', 'discount_percent', 0) END
			) AS data,
			COUNT(*) OVER() AS total_count
		FROM transactions t
		LEFT JOIN "user" u ON u.id = t.user_id
		LEFT JOIN courses c ON c.id = t.course_id
		LEFT JOIN coupons cp ON cp.id = t.coupon_id
		` + whereClause + `
		ORDER BY t.created_at DESC 
		LIMIT $` + fmt.Sprint(len(args)+1) + ` OFFSET $` + fmt.Sprint(len(args)+2)

	args = append(args, limit, offset)

	var rows []struct {
		Data       []byte `db:"data"`
		TotalCount int    `db:"total_count"`
	}
	if err := m.DB.SelectContext(ctx, &rows, query, args...); err != nil {
		return nil, 0, err
	}

	list := make([]Transaction, 0, len(rows))
	for _, r := range rows {
		var tx Transaction
		if err := json.Unmarshal(r.Data, &tx); err != nil {
			return nil, 0, err
		}
		list = append(list, tx)
		total = r.TotalCount
	}

	return list, total, nil
}

func (m *TransactionsModule) GetCoursePriceRepository(ctx context.Context, courseID string) (float64, error) {
	var price float64
	err := m.DB.GetContext(ctx, &price, `SELECT final_price FROM courses WHERE id = $1`, courseID)
	return price, err
}

// ── Webhook events ──
//
// Events are stored as unprocessed first, then flipped to processed only
// after the business-logic side effects (enrollment, coupon usage, status
// update) have completed. This prevents a crash mid-webhook from causing
// WebhookEventExistsRepository to report a paid-but-unenrolled event as
// already handled, which would silently swallow a paying customer.

func (m *TransactionsModule) WebhookEventExistsRepository(ctx context.Context, eventID string) (bool, error) {
	var exists bool
	err := m.DB.GetContext(ctx, &exists, `SELECT EXISTS(SELECT 1 FROM webhook_events WHERE razorpay_event_id = $1 AND processed = true)`, eventID)
	if err != nil {
		return false, err
	}
	return exists, nil
}

func (m *TransactionsModule) StoreWebhookEventRepository(ctx context.Context, eventID, eventType string) error {
	_, err := m.DB.ExecContext(ctx, `
		INSERT INTO webhook_events (razorpay_event_id, event_type, processed) 
		VALUES ($1, $2, false) ON CONFLICT DO NOTHING`, eventID, eventType)
	return err
}

func (m *TransactionsModule) MarkWebhookEventProcessedRepository(ctx context.Context, eventID string) error {
	_, err := m.DB.ExecContext(ctx, `UPDATE webhook_events SET processed = true WHERE razorpay_event_id = $1`, eventID)
	return err
}

// ── Public API ──
