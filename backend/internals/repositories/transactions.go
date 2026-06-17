package repositories

import (
	"database/sql"
	"fmt"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type TransactionRepository struct{ DB *sql.DB }

func NewTransactionRepository() *TransactionRepository { return &TransactionRepository{DB: database.DB} }

func (r *TransactionRepository) Create(userID, courseID string, couponID *string, razorpayOrderID string, amount float64) (*models.Transaction, error) {
	var t models.Transaction
	err := r.DB.QueryRow(`
		INSERT INTO transactions (user_id, course_id, coupon_id, razorpay_order_id, amount, currency, status)
		VALUES ($1, $2, $3, $4, $5, 'INR', 'pending')
		RETURNING id, user_id, course_id, coupon_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, error_description, confirmed_at, created_at`,
		userID, courseID, couponID, razorpayOrderID, amount,
	).Scan(&t.ID, &t.UserID, &t.CourseID, &t.CouponID, &t.RazorpayOrderID, &t.RazorpayPaymentID, &t.Amount, &t.Currency, &t.Status, &t.ErrorDescription, &t.ConfirmedAt, &t.CreatedAt)
	return &t, err
}

func (r *TransactionRepository) FindByRazorpayOrderID(orderID string) (*models.Transaction, error) {
	var t models.Transaction
	err := r.DB.QueryRow(`
		SELECT id, user_id, course_id, coupon_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, error_description, confirmed_at, created_at
		FROM transactions WHERE razorpay_order_id = $1`, orderID).
		Scan(&t.ID, &t.UserID, &t.CourseID, &t.CouponID, &t.RazorpayOrderID, &t.RazorpayPaymentID, &t.Amount, &t.Currency, &t.Status, &t.ErrorDescription, &t.ConfirmedAt, &t.CreatedAt)
	return &t, err
}

func (r *TransactionRepository) MarkSuccess(id, razorpayPaymentID string) error {
	_, err := r.DB.Exec(`
		UPDATE transactions SET status = 'success', razorpay_payment_id = $1, confirmed_at = CURRENT_TIMESTAMP WHERE id = $2`,
		razorpayPaymentID, id)
	return err
}

func (r *TransactionRepository) MarkFailed(id string, desc *string) error {
	_, err := r.DB.Exec(`UPDATE transactions SET status = 'failed', error_description = $1 WHERE id = $2`, desc, id)
	return err
}

func (r *TransactionRepository) List(page, limit int, userID string) ([]models.Transaction, int, error) {
	args := []interface{}{}
	where := "1=1"
	idx := 1
	if userID != "" {
		where = "user_id = $1"
		args = append(args, userID)
		idx++
	}
	var total int
	r.DB.QueryRow("SELECT COUNT(*) FROM transactions WHERE "+where, args...).Scan(&total)

	offset := (page - 1) * limit
	args = append(args, limit, offset)
	rows, err := r.DB.Query(`
		SELECT id, user_id, course_id, coupon_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, error_description, confirmed_at, created_at
		FROM transactions WHERE `+where+` ORDER BY created_at DESC LIMIT $`+itoa(idx)+` OFFSET $`+itoa(idx+1), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var list []models.Transaction
	for rows.Next() {
		var t models.Transaction
		rows.Scan(&t.ID, &t.UserID, &t.CourseID, &t.CouponID, &t.RazorpayOrderID, &t.RazorpayPaymentID, &t.Amount, &t.Currency, &t.Status, &t.ErrorDescription, &t.ConfirmedAt, &t.CreatedAt)
		list = append(list, t)
	}
	if list == nil {
		list = []models.Transaction{}
	}
	return list, total, rows.Err()
}

func (r *TransactionRepository) WebhookEventExists(eventID string) bool {
	var exists bool
	r.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM webhook_events WHERE razorpay_event_id = $1 AND processed = true)`, eventID).Scan(&exists)
	return exists
}

func (r *TransactionRepository) StoreWebhookEvent(eventID, eventType string) error {
	_, err := r.DB.Exec(`INSERT INTO webhook_events (razorpay_event_id, event_type, processed) VALUES ($1, $2, true) ON CONFLICT DO NOTHING`, eventID, eventType)
	return err
}

func itoa(i int) string {
	return fmt.Sprintf("%d", i)
}
