package transactions

import (
	"context"
	cryptorand "crypto/rand"
	"errors"
	"fmt"
	"log"
	"math"
)

const (
	// minRazorpayAmountPaise is Razorpay's minimum chargeable order amount (₹1).
	minRazorpayAmountPaise int64 = 100
)

// newTransactionID generates a random UUIDv4 client-side so it can be used as
// the Razorpay order reference BEFORE the transaction row exists in the DB.
// This is what lets InitiateService create the Razorpay order first and only
// touch the database once, instead of insert-then-update.
func newTransactionID() (string, error) {
	b := make([]byte, 16)
	if _, err := cryptorand.Read(b); err != nil {
		return "", err
	}
	b[6] = (b[6] & 0x0f) | 0x40 // version 4
	b[8] = (b[8] & 0x3f) | 0x80 // variant 10
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16]), nil
}

func (m *TransactionsModule) InitiateService(ctx context.Context, userID string, req InitiateTransactionRequest) (*InitiateTransactionResponse, error) {
	amount, err := m.GetCoursePriceRepository(ctx, req.CourseID)
	if err != nil {
		return nil, fmt.Errorf("course not found")
	}

	var couponID *string
	if req.CouponCode != nil && *req.CouponCode != "" {
		check, coupon, err := m.Coupons.ValidateAndFetchCouponService(*req.CouponCode, req.CourseID)
		if err != nil {
			return nil, fmt.Errorf("failed to load coupon: %w", err)
		}
		if !check.Valid {
			reason := "invalid coupon"
			if check.Reason != nil {
				reason = *check.Reason
			}
			return nil, errors.New(reason)
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

	// Generate the id up front so it can be used as the Razorpay order
	// reference before any DB write happens.
	txID, err := newTransactionID()
	if err != nil {
		return nil, fmt.Errorf("failed to generate transaction id: %w", err)
	}

	// Create the Razorpay order FIRST. Previously the flow was:
	//   INSERT (pending, no order id) -> call Razorpay -> UPDATE (attach order id)
	//   or, on gateway failure:
	//   INSERT (pending, no order id) -> call Razorpay fails -> UPDATE (mark failed)
	// i.e. always 2 DB round trips. By generating the id ourselves and
	// calling Razorpay first, the common (success) path becomes a single
	// INSERT with the order id already attached, and the failure path
	// becomes ZERO DB writes (nothing was ever written for an order that
	// never got created).
	order, err := m.Razorpay.CreateOrder(amountPaise, "INR", txID)
	if err != nil {
		return nil, fmt.Errorf("failed to create payment order: %w", err)
	}

	tx, err := m.CreateRepository(ctx, txID, userID, req.CourseID, couponID, order.ID, amount)
	if err != nil {
		// Order exists on Razorpay's side but we couldn't persist it locally.
		// This trades away the old "always have a local row" guarantee for
		// one fewer round trip on every successful initiate; a DB write
		// failing right after a successful read is rare, and should be
		// caught by error monitoring/alerting rather than paid for on every
		// request with an extra write. If that tradeoff isn't acceptable,
		// keep the original insert-before-order-create ordering instead.
		return nil, fmt.Errorf("failed to persist transaction: %w", err)
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

	// Single round trip: logs the event (idempotent no-op on retry) AND
	// tells us whether it was already fully processed, replacing the old
	// WebhookEventExistsRepository + StoreWebhookEventRepository pair.
	alreadyProcessed, err := m.UpsertWebhookEventRepository(ctx, payload.EventID, payload.Event)
	if err != nil {
		return fmt.Errorf("failed to upsert webhook event: %w", err)
	}
	if alreadyProcessed {
		return nil
	}

	tx, err := m.FindByRazorpayOrderIDRepository(ctx, payload.OrderID)
	if err != nil {
		return fmt.Errorf("transaction not found for order %s: %w", payload.OrderID, err)
	}

	switch payload.Event {
	case "payment.captured":
		// Single atomic statement: updates the transaction AND flips the
		// webhook event to processed in one round trip (previously 2 calls:
		// MarkSuccessRepository then MarkWebhookEventProcessedRepository).
		// Being one SQL statement also closes a consistency gap that
		// existed before - a mid-flight crash can no longer leave the
		// transaction marked success while the webhook event stays
		// unprocessed (or vice versa).
		if err := m.MarkSuccessAndWebhookProcessedRepository(ctx, tx.ID, payload.PaymentID, payload.EventID); err != nil {
			return fmt.Errorf("failed to mark transaction success: %w", err)
		}

		// NOTE: Coupons/Enrollments live in separate modules with their own
		// DB handles, so this can't be folded into the statement above
		// without those repositories accepting a shared transaction. Errors
		// are surfaced (not silently dropped) so the webhook fails and
		// Razorpay retries, rather than looking successful while enrollment
		// is missing.
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
		// Same idea: one round trip instead of two.
		if err := m.MarkFailedAndWebhookProcessedRepository(ctx, tx.ID, &payload.ErrorDescription, payload.EventID); err != nil {
			return fmt.Errorf("failed to mark transaction failed: %w", err)
		}

	default:
		log.Printf("transactions: unknown webhook event %s (id=%s) — acknowledged to stop retries", payload.Event, payload.EventID)
		if err := m.MarkWebhookEventProcessedRepository(ctx, payload.EventID); err != nil {
			log.Printf("transactions: failed to mark webhook event %s processed: %v", payload.EventID, err)
		}
	}

	return nil
}
