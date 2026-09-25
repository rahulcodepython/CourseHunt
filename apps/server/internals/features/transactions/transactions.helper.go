package transactions

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"math"
	"time"

	"coursehunt/server/internals/generic"

	"github.com/google/uuid"
)

type TransactionListPayload struct {
	Total int           `json:"total"`
	Data  []Transaction `json:"data"`
}

// ProcessPendingRefundsCron polls the transaction_refunds table using PostgreSQL SKIP LOCKED
// to safely process any pending duplicate payment refunds without ephemeral queue drops.
func (a *App) ProcessPendingRefundsCron(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			a.processPendingRefundsBatch(ctx)
		}
	}
}

func (a *App) processPendingRefundsBatch(ctx context.Context) {
	queryCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	rows, err := a.DB.Query(queryCtx, `
		SELECT id, razorpay_payment_id FROM transaction_refunds
		WHERE refund_status = 'pending' AND razorpay_refund_id IS NULL
		ORDER BY created_at ASC
		LIMIT 10
		FOR UPDATE SKIP LOCKED
	`)
	if err != nil {
		return
	}
	defer rows.Close()

	type pendingItem struct {
		id        string
		paymentID string
	}
	var batch []pendingItem

	for rows.Next() {
		var item pendingItem
		if err := rows.Scan(&item.id, &item.paymentID); err == nil && item.paymentID != "" {
			batch = append(batch, item)
		}
	}

	for _, item := range batch {
		a.processDuplicateRefund(item.id, item.paymentID)
	}
}

// StartBackgroundWorkers launches the persistent auto-refund outbox poller.
func (a *App) StartBackgroundWorkers(ctx context.Context) {
	go a.ProcessPendingRefundsCron(ctx)
}

func (a *App) processDuplicateRefund(refundID, paymentID string) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	refund, err := a.Rzp.RefundPayment(ctx, paymentID)
	if err != nil {
		slog.Error("duplicate auto-refund failed via razorpay", "refund_id", refundID, "payment_id", paymentID, "error", err)
		_ = a.MarkRefundFailedRepository(ctx, refundID, err.Error())
		return
	}

	if err := a.MarkRefundPendingRepository(ctx, refundID, refund.ID); err != nil {
		slog.Error("failed to update refund record with razorpay refund id", "refund_id", refundID, "razorpay_refund_id", refund.ID, "error", err)
	}
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
			go a.processDuplicateRefund(refundID, paymentID)
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
