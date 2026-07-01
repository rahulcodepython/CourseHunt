package transactions

import (
	"fmt"
)

func (m *TransactionsModule) CreateRepository(userID, courseID string, couponID *string, razorpayOrderID string, amount float64) (*Transaction, error) {
	var t Transaction
	var dbCouponID *string
	err := m.DB.QueryRow(`
		INSERT INTO transactions (user_id, course_id, coupon_id, razorpay_order_id, amount, currency, status)
		VALUES ($1, $2, $3, $4, $5, 'INR', 'pending')
		RETURNING id, user_id, course_id, coupon_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, error_description, confirmed_at, created_at`,
		userID, courseID, couponID, razorpayOrderID, amount,
	).Scan(&t.ID, &t.User.ID, &t.Course.ID, &dbCouponID, &t.RazorpayOrderID, &t.RazorpayPaymentID, &t.Amount, &t.Currency, &t.Status, &t.ErrorDescription, &t.ConfirmedAt, &t.CreatedAt)
	if dbCouponID != nil {
		t.Coupon.ID = *dbCouponID
	}
	return &t, err
}

func (m *TransactionsModule) FindByRazorpayOrderIDRepository(orderID string) (*Transaction, error) {
	var t Transaction
	var dbCouponID *string
	err := m.DB.QueryRow(`
		SELECT id, user_id, course_id, coupon_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, error_description, confirmed_at, created_at
		FROM transactions WHERE razorpay_order_id = $1`, orderID).
		Scan(&t.ID, &t.User.ID, &t.Course.ID, &dbCouponID, &t.RazorpayOrderID, &t.RazorpayPaymentID, &t.Amount, &t.Currency, &t.Status, &t.ErrorDescription, &t.ConfirmedAt, &t.CreatedAt)
	if dbCouponID != nil {
		t.Coupon.ID = *dbCouponID
	}
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
		where = "t.user_id = $1"
		args = append(args, userID)
		idx++
	}
	var total int
	m.DB.QueryRow("SELECT COUNT(*) FROM transactions t WHERE "+where, args...).Scan(&total)

	offset := (page - 1) * limit
	args = append(args, limit, offset)
	
	// manually doing limit/offset with correct indexed placeholders
	limitIdx := idx
	offsetIdx := idx + 1
	
	query := fmt.Sprintf(`
		SELECT t.id, t.user_id, u.name, u.image, t.course_id, c.title, c.thumbnail, t.coupon_id, cp.code, cp.discount_percent, t.razorpay_order_id, t.razorpay_payment_id, t.amount, t.currency, t.status, t.error_description, t.confirmed_at, t.created_at
		FROM transactions t
		LEFT JOIN "user" u ON u.id = t.user_id
		LEFT JOIN courses c ON c.id = t.course_id
		LEFT JOIN coupons cp ON cp.id = t.coupon_id
		WHERE %s ORDER BY t.created_at DESC LIMIT $%d OFFSET $%d`, where, limitIdx, offsetIdx)

	rows, err := m.DB.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var list []Transaction
	for rows.Next() {
		var t Transaction
		var dbCouponID, dbCouponCode, uName, cTitle *string
		var dbDiscountPercent *float64
		var uImage, cThumb *string
		rows.Scan(&t.ID, &t.User.ID, &uName, &uImage, &t.Course.ID, &cTitle, &cThumb, &dbCouponID, &dbCouponCode, &dbDiscountPercent, &t.RazorpayOrderID, &t.RazorpayPaymentID, &t.Amount, &t.Currency, &t.Status, &t.ErrorDescription, &t.ConfirmedAt, &t.CreatedAt)
		if uName != nil { t.User.Name = *uName }
		t.User.Image = uImage
		if cTitle != nil { t.Course.Title = *cTitle }
		t.Course.Thumbnail = cThumb
		if dbCouponID != nil {
			t.Coupon.ID = *dbCouponID
			if dbCouponCode != nil { t.Coupon.Code = *dbCouponCode }
			if dbDiscountPercent != nil { t.Coupon.DiscountValue = *dbDiscountPercent }
		}
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
