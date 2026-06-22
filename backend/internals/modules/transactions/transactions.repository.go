package transactions

import (
	"fmt"
)

func (m *TransactionsModule) CreateRepository(userID, courseID string, couponID *string, razorpayOrderID string, amount float64) (*Transaction, error) {
	var t Transaction
	err := m.DB.QueryRow(`
		INSERT INTO transactions (user_id, course_id, coupon_id, razorpay_order_id, amount, currency, status)
		VALUES ($1, $2, $3, $4, $5, 'INR', 'pending')
		RETURNING id, user_id, course_id, coupon_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, error_description, confirmed_at, created_at`,
		userID, courseID, couponID, razorpayOrderID, amount,
	).Scan(&t.ID, &t.UserID, &t.CourseID, &t.CouponID, &t.RazorpayOrderID, &t.RazorpayPaymentID, &t.Amount, &t.Currency, &t.Status, &t.ErrorDescription, &t.ConfirmedAt, &t.CreatedAt)
	return &t, err
}

func (m *TransactionsModule) FindByRazorpayOrderIDRepository(orderID string) (*Transaction, error) {
	var t Transaction
	err := m.DB.QueryRow(`
		SELECT id, user_id, course_id, coupon_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, error_description, confirmed_at, created_at
		FROM transactions WHERE razorpay_order_id = $1`, orderID).
		Scan(&t.ID, &t.UserID, &t.CourseID, &t.CouponID, &t.RazorpayOrderID, &t.RazorpayPaymentID, &t.Amount, &t.Currency, &t.Status, &t.ErrorDescription, &t.ConfirmedAt, &t.CreatedAt)
	return &t, err
}

func (m *TransactionsModule) MarkSuccessRepository(id, razorpayPaymentID string) error {
	_, err := m.DB.Exec(`
		UPDATE transactions SET status = 'success', razorpay_payment_id = $1, confirmed_at = CURRENT_TIMESTAMP WHERE id = $2`,
		razorpayPaymentID, id)
	return err
}

func (m *TransactionsModule) MarkFailedRepository(id string, desc *string) error {
	_, err := m.DB.Exec(`UPDATE transactions SET status = 'failed', error_description = $1 WHERE id = $2`, desc, id)
	return err
}

func (m *TransactionsModule) ListRepository(page, limit int, userID string) ([]Transaction, int, error) {
	args := []interface{}{}
	where := "1=1"
	idx := 1
	if userID != "" {
		where = "user_id = $1"
		args = append(args, userID)
		idx++
	}
	var total int
	m.DB.QueryRow("SELECT COUNT(*) FROM transactions WHERE "+where, args...).Scan(&total)

	offset := (page - 1) * limit
	args = append(args, limit, offset)
	
	// manually doing limit/offset with correct indexed placeholders
	limitIdx := idx
	offsetIdx := idx + 1
	
	query := fmt.Sprintf(`
		SELECT id, user_id, course_id, coupon_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, error_description, confirmed_at, created_at
		FROM transactions WHERE %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, where, limitIdx, offsetIdx)

	rows, err := m.DB.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var list []Transaction
	for rows.Next() {
		var t Transaction
		rows.Scan(&t.ID, &t.UserID, &t.CourseID, &t.CouponID, &t.RazorpayOrderID, &t.RazorpayPaymentID, &t.Amount, &t.Currency, &t.Status, &t.ErrorDescription, &t.ConfirmedAt, &t.CreatedAt)
		list = append(list, t)
	}
	if list == nil {
		list = []Transaction{}
	}
	return list, total, rows.Err()
}

func (m *TransactionsModule) WebhookEventExistsRepository(eventID string) bool {
	var exists bool
	m.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM webhook_events WHERE razorpay_event_id = $1 AND processed = true)`, eventID).Scan(&exists)
	return exists
}

func (m *TransactionsModule) StoreWebhookEventRepository(eventID, eventType string) error {
	_, err := m.DB.Exec(`INSERT INTO webhook_events (razorpay_event_id, event_type, processed) VALUES ($1, $2, true) ON CONFLICT DO NOTHING`, eventID, eventType)
	return err
}
