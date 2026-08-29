package transactions

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"

	"github.com/google/uuid"
)

// Initiate is the sole place the paid amount is ever computed — the client
// never supplies (or can influence) it. Order: start from the course's
// final_price, apply the coupon discount (if any and valid) on top of that,
// then apply tax on the discounted amount. This same computation is what
// gets sent to Razorpay and snapshotted onto the transaction row, so an
// invoice generated later reflects exactly what was charged even if the
// course's price or the platform's tax rate changes afterward.
func (a *App) Initiate(ctx context.Context, userID string, req InitiateTransactionRequest) (*InitiateTransactionResponse, error) {
	resp, err := a.initiate(ctx, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return nil, utils.ErrNotFound("Course not found.", err)
		}
		if errors.Is(err, generic.ErrTransactionsInvalidCoupon) {
			return nil, utils.ErrBadRequest("Invalid coupon.", err)
		}
		if errors.Is(err, generic.ErrTransactionsAlreadyEnrolled) {
			return nil, utils.ErrBadRequest(generic.ErrMsgAlreadyEnrolled, err)
		}
		if errors.Is(err, generic.ErrTransactionsCourseIsFree) {
			return nil, utils.ErrBadRequest(generic.ErrMsgFreeCourseDirect, err)
		}
		return nil, utils.ErrInternal("Failed to initiate transaction.", err)
	}
	return resp, nil
}

func (a *App) initiate(ctx context.Context, userID string, req InitiateTransactionRequest) (*InitiateTransactionResponse, error) {
	// ISSUE-027: Check if user is already enrolled before initiating payment
	if a.Enrollments != nil {
		isEnrolled, err := a.Enrollments.IsEnrolled(ctx, userID, req.CourseID)
		if err == nil && isEnrolled {
			return nil, generic.ErrTransactionsAlreadyEnrolled
		}
	}

	if existing, err := a.GetPendingTransactionRepository(ctx, userID, req.CourseID); err == nil && existing != nil && existing.RazorpayOrderID != nil {
		return &InitiateTransactionResponse{
			TransactionID:   existing.ID,
			RazorpayOrderID: *existing.RazorpayOrderID,
			Amount:          existing.Amount,
			Currency:        existing.Currency,
			RazorpayKey:     a.Cfg.RazorpayKeyID,
		}, nil
	}

	pricing, err := a.GetCoursePricingRepository(ctx, req.CourseID)
	if err != nil {
		return nil, generic.ErrCoursesCourseNotFound
	}

	// ISSUE-028: Prevent creating paid transactions for free courses
	if pricing.FinalPrice <= 0 {
		return nil, generic.ErrTransactionsCourseIsFree
	}

	discountedAmount := pricing.FinalPrice
	discountAmount := 0.0
	var couponID *string
	if req.CouponCode != nil && *req.CouponCode != "" {
		check, coupon, err := a.Coupons.ValidateAndFetchCoupon(ctx, *req.CouponCode, req.CourseID)
		if err != nil {
			return nil, fmt.Errorf("failed to load coupon: %w", err)
		}
		if !check.Valid {
			reason := "invalid coupon"
			if check.Reason != nil {
				reason = *check.Reason
			}
			return nil, fmt.Errorf("%w: %s", generic.ErrTransactionsInvalidCoupon, reason)
		}
		if coupon != nil {
			discountAmount = discountedAmount * check.DiscountPercent / 100
			discountedAmount -= discountAmount
			if discountedAmount < 0 {
				discountAmount += discountedAmount // shrink the recorded discount to match what was actually applied
				discountedAmount = 0
			}
			couponID = &coupon.ID
		}
	}

	taxAmount := discountedAmount * a.Cfg.TaxPercent / 100
	amount := discountedAmount + taxAmount

	amountPaise := int64(math.Round(amount * 100))
	if amountPaise < 100 {
		amountPaise = 100
	}

	txID := uuid.NewString()

	order, err := a.Rzp.CreateOrder(amountPaise, "INR", txID)
	if err != nil {
		return nil, fmt.Errorf("failed to create payment order: %w", err)
	}

	tx, err := a.CreateRepository(ctx, txID, userID, req.CourseID, couponID, order.ID, amount, pricing.ActualPrice, pricing.FinalPrice, a.Cfg.TaxPercent, discountAmount)
	if err != nil {
		return nil, fmt.Errorf("failed to persist transaction: %w", err)
	}

	return &InitiateTransactionResponse{
		TransactionID:   tx.ID,
		RazorpayOrderID: order.ID,
		Amount:          amount,
		Currency:        "INR",
		RazorpayKey:     a.Cfg.RazorpayKeyID,
	}, nil
}

func (a *App) HandleWebhook(ctx context.Context, rawBody []byte, signature string, payload WebhookPayload) error {
	if err := a.processWebhook(ctx, rawBody, signature, payload); err != nil {
		log.Printf("Webhook error: %v", err)
		if errors.Is(err, generic.ErrTransactionsInvalidSignature) {
			return utils.ErrUnauthorized("invalid signature", err)
		}
		return utils.ErrInternal("Webhook processing failed", err)
	}
	return nil
}

func (a *App) processWebhook(ctx context.Context, rawBody []byte, signature string, payload WebhookPayload) error {
	if !a.Rzp.VerifyWebhookSignature(rawBody, signature) {
		return generic.ErrTransactionsInvalidSignature
	}

	alreadyProcessed, err := a.UpsertWebhookEventRepository(ctx, payload.EventID, payload.Event)
	if err != nil {
		return fmt.Errorf("failed to upsert webhook event: %w", err)
	}
	if alreadyProcessed {
		return nil
	}

	switch payload.Event {
	case "payment.captured":
		if err := a.MarkPaymentCapturedRepository(ctx, payload.PaymentID, payload.OrderID, payload.EventID); err != nil {
			return fmt.Errorf("failed to mark payment captured for order %s: %w", payload.OrderID, err)
		}

	case "payment.failed":
		if err := a.MarkPaymentFailedRepository(ctx, &payload.ErrorDescription, payload.OrderID, payload.EventID); err != nil {
			return fmt.Errorf("failed to mark payment failed for order %s: %w", payload.OrderID, err)
		}

	default:
		log.Printf("transactions: unknown webhook event %s (id=%s) — acknowledged to stop retries", payload.Event, payload.EventID)
		if err := a.MarkWebhookEventProcessedRepository(ctx, payload.EventID); err != nil {
			log.Printf("transactions: failed to mark webhook event %s processed: %v", payload.EventID, err)
		}
	}

	return nil
}

func (a *App) Status(ctx context.Context, txID, userID string) (*TransactionStatusResponse, error) {
	resp, err := a.GetTransactionStatusRepository(ctx, txID, userID)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch transaction status.", err)
	}
	return resp, nil
}

func (a *App) Checkout(ctx context.Context, courseID string) (*CheckoutCourseResponse, error) {
	resp, err := a.GetCheckoutCourseRepository(ctx, courseID)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch checkout course info.", err)
	}
	// Informational only — the authoritative amount (and tax) is always
	// (re)computed server-side in Initiate, never trusted from here.
	resp.TaxPercent = a.Cfg.TaxPercent
	return resp, nil
}

func (a *App) List(ctx context.Context, page, limit int, userID, tutorID, status, courseID, dateFrom, dateTo, errMsg string) ([]Transaction, int, error) {
	list, total, err := a.ListRepository(ctx, page, limit, userID, tutorID, status, courseID, dateFrom, dateTo)
	if err != nil {
		return nil, 0, utils.ErrInternal(errMsg, err)
	}
	return list, total, nil
}
