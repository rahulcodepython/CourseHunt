package transactions

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
	offset := (page - 1) * limit
	total := 0

	var query string
	var args []interface{}

	// OPTIMIZATION: Use COUNT(*) OVER() window function to pull full count
	// and record metrics in a single round-trip query execution.
	if userID != "" {
		query = `
			SELECT t.id, t.user_id, u.name, u.image, t.course_id, c.title, c.thumbnail, t.coupon_id, cp.code, cp.discount_percent, t.razorpay_order_id, t.razorpay_payment_id, t.amount, t.currency, t.status, t.error_description, t.confirmed_at, t.created_at,
			       COUNT(*) OVER() AS total_count
			FROM transactions t
			LEFT JOIN "user" u ON u.id = t.user_id
			LEFT JOIN courses c ON c.id = t.course_id
			LEFT JOIN coupons cp ON cp.id = t.coupon_id
			WHERE t.user_id = $1 
			ORDER BY t.created_at DESC 
			LIMIT $2 OFFSET $3`
		args = []interface{}{userID, limit, offset}
	} else {
		query = `
			SELECT t.id, t.user_id, u.name, u.image, t.course_id, c.title, c.thumbnail, t.coupon_id, cp.code, cp.discount_percent, t.razorpay_order_id, t.razorpay_payment_id, t.amount, t.currency, t.status, t.error_description, t.confirmed_at, t.created_at,
			       COUNT(*) OVER() AS total_count
			FROM transactions t
			LEFT JOIN "user" u ON u.id = t.user_id
			LEFT JOIN courses c ON c.id = t.course_id
			LEFT JOIN coupons cp ON cp.id = t.coupon_id
			ORDER BY t.created_at DESC 
			LIMIT $1 OFFSET $2`
		args = []interface{}{limit, offset}
	}

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

		err := rows.Scan(
			&t.ID, &t.User.ID, &uName, &uImage, &t.Course.ID, &cTitle, &cThumb,
			&dbCouponID, &dbCouponCode, &dbDiscountPercent, &t.RazorpayOrderID,
			&t.RazorpayPaymentID, &t.Amount, &t.Currency, &t.Status,
			&t.ErrorDescription, &t.ConfirmedAt, &t.CreatedAt,
			&total, // Captures windowed dataset total directly
		)
		if err != nil {
			return nil, 0, err
		}

		if uName != nil {
			t.User.Name = *uName
		}
		t.User.Image = uImage
		if cTitle != nil {
			t.Course.Title = *cTitle
		}
		t.Course.Thumbnail = cThumb
		if dbCouponID != nil {
			t.Coupon.ID = *dbCouponID
			if dbCouponCode != nil {
				t.Coupon.Code = *dbCouponCode
			}
			if dbDiscountPercent != nil {
				t.Coupon.DiscountValue = *dbDiscountPercent
			}
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
	err := m.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM webhook_events WHERE razorpay_event_id = $1 AND processed = true)`, eventID).Scan(&exists)
	if err != nil {
		return false
	}
	return exists
}

func (m *TransactionsModule) StoreWebhookEventRepository(eventID, eventType string) error {
	_, err := m.DB.Exec(`INSERT INTO webhook_events (razorpay_event_id, event_type, processed) VALUES ($1, $2, true) ON CONFLICT DO NOTHING`, eventID, eventType)
	return err
}

func (m *TransactionsModule) GetCoursePriceRepository(courseID string) (float64, error) {
	var price float64
	err := m.DB.QueryRow(`SELECT final_price FROM courses WHERE id = $1`, courseID).Scan(&price)
	return price, err
}
