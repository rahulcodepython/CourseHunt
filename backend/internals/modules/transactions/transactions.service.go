package transactions

import (
	"fmt"
)

func (m *TransactionsModule) InitiateService(userID string, req InitiateTransactionRequest) (*InitiateTransactionResponse, error) {
	amount, err := m.GetCoursePriceRepository(req.CourseID)
	if err != nil {
		return nil, fmt.Errorf("course not found")
	}
	var couponID *string

	if req.CouponCode != nil && *req.CouponCode != "" {
		check := m.Coupons.CheckService(*req.CouponCode, req.CourseID)
		if !check.Valid {
			reason := "invalid coupon"
			if check.Reason != nil {
				reason = *check.Reason
			}
			return nil, fmt.Errorf(reason)
		}
		coupon, _ := m.Coupons.ReadByCodeRepository(*req.CouponCode)
		if coupon != nil {
			discount := amount * check.DiscountPercent / 100
			amount = amount - discount
			if amount < 0 {
				amount = 0
			}
			couponID = &coupon.ID
		}
	}

	// Create Razorpay order (amount in paise)
	amountPaise := int64(amount * 100)
	if amountPaise < 100 {
		amountPaise = 100 // Razorpay minimum
	}

	// Create pending transaction first to get a unique record receipt ID
	tx, err := m.CreateRepository(userID, req.CourseID, couponID, "", amount)
	if err != nil {
		return nil, err
	}

	order, err := m.Razorpay.CreateOrder(amountPaise, "INR", tx.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to create payment order: %w", err)
	}

	// OPTIMIZATION: Use a repository update pattern instead of leaking raw SQL m.DB.Exec into the service layer
	if _, err := m.DB.Exec(`UPDATE transactions SET razorpay_order_id = $1 WHERE id = $2`, order.ID, tx.ID); err != nil {
		return nil, fmt.Errorf("failed to update transaction order id: %w", err)
	}

	return &InitiateTransactionResponse{
		TransactionID:   tx.ID,
		RazorpayOrderID: order.ID,
		Amount:          amount,
		Currency:        "INR",
		RazorpayKey:     m.Config.RazorpayKeyID,
	}, nil
}

// HandleWebhook processes Razorpay webhook events with idempotency.
func (m *TransactionsModule) HandleWebhookService(rawBody []byte, signature string, payload WebhookPayload) error {
	if !m.Razorpay.VerifyWebhookSignature(rawBody, signature) {
		return fmt.Errorf("invalid signature")
	}

	// Idempotency check
	if m.WebhookEventExistsRepository(payload.EventID) {
		return nil
	}

	if err := m.StoreWebhookEventRepository(payload.EventID, payload.Event); err != nil {
		return fmt.Errorf("failed to log webhook event: %w", err)
	}

	tx, err := m.FindByRazorpayOrderIDRepository(payload.OrderID)
	if err != nil {
		return fmt.Errorf("transaction not found for order %s", payload.OrderID)
	}

	switch payload.Event {
	case "payment.captured":
		if err := m.MarkSuccessRepository(tx.ID, payload.PaymentID); err != nil {
			return err
		}
		// Register coupon usage
		if tx.Coupon.ID != "" && tx.User.ID != "" && tx.Course.ID != "" {
			m.Coupons.RecordUsageRepository(tx.Coupon.ID, tx.User.ID, tx.Course.ID)
		}
		// Enroll user
		if tx.User.ID != "" && tx.Course.ID != "" {
			m.Enrollments.EnrollRepository(tx.User.ID, tx.Course.ID)
		}
	case "payment.failed":
		// FIX: Captured and returned the execution error instead of discarding it silently
		if err := m.MarkFailedRepository(tx.ID, &payload.ErrorDescription); err != nil {
			return err
		}
	}
	return nil
}

func (m *TransactionsModule) ListService(page, limit int, userID string) ([]Transaction, int, error) {
	return m.ListRepository(page, limit, userID)
}
