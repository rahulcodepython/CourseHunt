package transactions

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math"
)

const (
	// minRazorpayAmountPaise is Razorpay's minimum chargeable order amount (₹1).
	minRazorpayAmountPaise int64 = 100
)

func (m *TransactionsModule) InitiateService(ctx context.Context, userID string, req InitiateTransactionRequest) (*InitiateTransactionResponse, error) {
	amount, err := m.GetCoursePriceRepository(ctx, req.CourseID)
	if err != nil {
		return nil, fmt.Errorf("course not found")
	}

	var couponID *string
	if req.CouponCode != nil && *req.CouponCode != "" {
		check := m.Coupons.CheckCoupon(*req.CouponCode, req.CourseID)
		if !check.Valid {
			reason := "invalid coupon"
			if check.Reason != nil {
				reason = *check.Reason
			}
			return nil, errors.New(reason)
		}
		coupon, err := m.Coupons.ReadByCodeRepository(*req.CouponCode)
		if err != nil {
			return nil, fmt.Errorf("failed to load coupon: %w", err)
		}
		if coupon != nil {
			discount := amount * check.DiscountPercent / 100
			amount -= discount
			if amount < 0 {
				amount = 0
			}
			couponID = &coupon.ID
		}
	}

	amountPaise := int64(math.Round(amount * 100))
	if amountPaise < minRazorpayAmountPaise {
		amountPaise = minRazorpayAmountPaise
	}

	// Create pending transaction first so we have an id to attach to the
	// Razorpay order as a reference.
	tx, err := m.CreateRepository(ctx, userID, req.CourseID, couponID, "", amount)
	if err != nil {
		return nil, err
	}

	order, err := m.Razorpay.CreateOrder(amountPaise, "INR", tx.ID)
	if err != nil {
		// Don't leave the row stuck in "pending" forever with no order id.
		if markErr := m.MarkOrderCreationFailedRepository(ctx, tx.ID); markErr != nil {
			log.Printf("transactions: failed to mark tx %s as failed after order-create error: %v", tx.ID, markErr)
		}
		return nil, fmt.Errorf("failed to create payment order: %w", err)
	}

	if err := m.UpdateRazorpayOrderIDRepository(ctx, tx.ID, order.ID); err != nil {
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

func (m *TransactionsModule) HandleWebhookService(ctx context.Context, rawBody []byte, signature string, payload WebhookPayload) error {
	if !m.Razorpay.VerifyWebhookSignature(rawBody, signature) {
		return fmt.Errorf("invalid signature")
	}

	processed, err := m.WebhookEventExistsRepository(ctx, payload.EventID)
	if err != nil {
		// A DB error here must NOT be treated as "not seen yet" - that risks
		// double-processing a payment (double enrollment, double coupon usage)
		// during a DB blip. Fail loud so Razorpay retries.
		return fmt.Errorf("failed to check webhook event: %w", err)
	}
	if processed {
		return nil
	}

	// Recorded as unprocessed until the business-logic side effects below
	// succeed. ON CONFLICT DO NOTHING makes this safe to re-run on retry.
	if err := m.StoreWebhookEventRepository(ctx, payload.EventID, payload.Event); err != nil {
		return fmt.Errorf("failed to log webhook event: %w", err)
	}

	tx, err := m.FindByRazorpayOrderIDRepository(ctx, payload.OrderID)
	if err != nil {
		return fmt.Errorf("transaction not found for order %s: %w", payload.OrderID, err)
	}

	switch payload.Event {
	case "payment.captured":
		if err := m.MarkSuccessRepository(ctx, tx.ID, payload.PaymentID); err != nil {
			return fmt.Errorf("failed to mark transaction success: %w", err)
		}

		// NOTE: Coupons/Enrollments live in separate modules with their own
		// DB handles, so this can't be wrapped in a single sqlx.Tx without
		// those repositories accepting a shared transaction. Errors are
		// surfaced (not silently dropped) so the webhook fails and Razorpay
		// retries, rather than looking successful while enrollment is missing.
		if tx.Coupon.ID != "" && tx.User.ID != "" && tx.Course.ID != "" {
			if err := m.Coupons.RecordUsageRepository(tx.Coupon.ID, tx.User.ID, tx.Course.ID); err != nil {
				return fmt.Errorf("failed to record coupon usage for tx %s: %w", tx.ID, err)
			}
		}
		if tx.User.ID != "" && tx.Course.ID != "" {
			if err := m.Enrollments.EnrollRepository(tx.User.ID, tx.Course.ID); err != nil {
				return fmt.Errorf("failed to enroll user for tx %s: %w", tx.ID, err)
			}
		}

	case "payment.failed":
		if err := m.MarkFailedRepository(ctx, tx.ID, &payload.ErrorDescription); err != nil {
			return fmt.Errorf("failed to mark transaction failed: %w", err)
		}
	}

	if err := m.MarkWebhookEventProcessedRepository(ctx, payload.EventID); err != nil {
		// Side effects already succeeded; log rather than fail, since
		// returning an error here would trigger a needless retry that
		// re-attempts (idempotent) enrollment/status updates.
		log.Printf("transactions: failed to mark webhook event %s processed: %v", payload.EventID, err)
	}

	return nil
}
