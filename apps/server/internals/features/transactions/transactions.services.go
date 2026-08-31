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
// then apply tax on the discounted amount.
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
		if errors.Is(err, generic.ErrTransactionsPendingExists) {
			return nil, utils.ErrConflict("You already have a payment in progress for this course. Please wait for it to complete, or try again in a moment.", err)
		}
		return nil, utils.ErrInternal("Failed to initiate transaction.", err)
	}
	return resp, nil
}

func (a *App) initiate(ctx context.Context, userID string, req InitiateTransactionRequest) (*InitiateTransactionResponse, error) {
	txID := uuid.NewString()

	alreadyEnrolled, claimed, err := a.InitiateClaimRepository(ctx, userID, req.CourseID, txID)
	if err != nil {
		return nil, fmt.Errorf("failed to check purchase eligibility: %w", err)
	}
	if alreadyEnrolled {
		return nil, generic.ErrTransactionsAlreadyEnrolled
	}
	if !claimed {
		return nil, generic.ErrTransactionsPendingExists
	}

	pricing, err := a.GetCoursePricingRepository(ctx, req.CourseID)
	if err != nil {
		_ = a.MarkTransactionFailedRepository(ctx, txID, "course lookup failed")
		return nil, generic.ErrCoursesCourseNotFound
	}

	// Prevent creating paid transactions for free courses
	if pricing.FinalPrice <= 0 {
		_ = a.MarkTransactionFailedRepository(ctx, txID, "free course direct enrollment required")
		return nil, generic.ErrTransactionsCourseIsFree
	}

	discountedAmount := pricing.FinalPrice
	discountAmount := 0.0
	var couponID *string
	if req.CouponCode != nil && *req.CouponCode != "" {
		check, coupon, err := a.Coupons.ValidateAndFetchCoupon(ctx, *req.CouponCode, req.CourseID)
		if err != nil {
			_ = a.MarkTransactionFailedRepository(ctx, txID, "failed to load coupon")
			return nil, fmt.Errorf("failed to load coupon: %w", err)
		}
		if !check.Valid {
			_ = a.MarkTransactionFailedRepository(ctx, txID, "invalid coupon")
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
				discountAmount += discountedAmount
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

	order, err := a.Rzp.CreateOrder(ctx, amountPaise, "INR", txID)
	if err != nil {
		// Release the claimed slot on order creation failure
		_ = a.MarkTransactionFailedRepository(ctx, txID, "failed to create razorpay order")
		return nil, fmt.Errorf("failed to create payment order: %w", err)
	}

	if err := a.FinalizeClaimedTransactionRepository(ctx, txID, order.ID, amount, pricing.ActualPrice, pricing.FinalPrice, a.Cfg.TaxPercent, discountAmount, couponID); err != nil {
		return nil, fmt.Errorf("failed to persist transaction: %w", err)
	}

	return &InitiateTransactionResponse{
		TransactionID:   txID,
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
		_, isDuplicate, refundID, paymentID, err := a.MarkPaymentCapturedRepository(ctx, payload.PaymentID, payload.OrderID, payload.EventID)
		if err != nil {
			return fmt.Errorf("failed to mark payment captured for order %s: %w", payload.OrderID, err)
		}
		if isDuplicate {
			a.enqueueDuplicateRefund(refundID, paymentID)
		}

	case "payment.failed":
		if err := a.MarkPaymentFailedRepository(ctx, &payload.ErrorDescription, payload.OrderID, payload.EventID); err != nil {
			return fmt.Errorf("failed to mark payment failed for order %s: %w", payload.OrderID, err)
		}

	case "refund.processed":
		if err := a.MarkRefundProcessedRepository(ctx, payload.RefundID, payload.PaymentID, payload.EventID); err != nil {
			return fmt.Errorf("failed to mark refund processed for refund %s: %w", payload.RefundID, err)
		}

	case "refund.failed":
		if err := a.MarkRefundFailedByRazorpayIDRepository(ctx, payload.RefundID, payload.EventID); err != nil {
			return fmt.Errorf("failed to mark refund failed for refund %s: %w", payload.RefundID, err)
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

func (a *App) ListRefunds(ctx context.Context, page, limit int, userID, status, courseID, dateFrom, dateTo, errMsg string) ([]RefundTransaction, int, error) {
	list, total, err := a.ListRefundsRepository(ctx, page, limit, userID, status, courseID, dateFrom, dateTo)
	if err != nil {
		return nil, 0, utils.ErrInternal(errMsg, err)
	}
	return list, total, nil
}
