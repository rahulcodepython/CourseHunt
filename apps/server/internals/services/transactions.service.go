package services

import (
	"fmt"
	"log"
	"math"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/razorpay"
	"coursehunt/server/internals/repositories"

	"github.com/google/uuid"
)

type TransactionsService struct {
	Repos           *repositories.TransactionsRepository
	EnrollmentsRepo *repositories.EnrollmentsRepository
	Cfg             *config.Config
	Rzp             *razorpay.Client
	CouponsS        *CouponsService
}

func NewTransactionsService(repos *repositories.TransactionsRepository, enrollmentsRepo *repositories.EnrollmentsRepository, cfg *config.Config, rzp *razorpay.Client, couponsS *CouponsService) *TransactionsService {
	return &TransactionsService{Repos: repos, EnrollmentsRepo: enrollmentsRepo, Cfg: cfg, Rzp: rzp, CouponsS: couponsS}
}

// InitiateService is the sole place the paid amount is ever computed — the
// client never supplies (or can influence) it. Order: start from the
// course's final_price, apply the coupon discount (if any and valid) on top
// of that, then apply tax on the discounted amount. This same computation is
// what gets sent to Razorpay and snapshotted onto the transaction row, so an
// invoice generated later reflects exactly what was charged even if the
// course's price or the platform's tax rate changes afterward.
func (s *TransactionsService) InitiateService(userID string, req entities.InitiateTransactionRequest) (*entities.InitiateTransactionResponse, error) {
	// ISSUE-027: Check if user is already enrolled before initiating payment
	if s.EnrollmentsRepo != nil {
		isEnrolled, err := s.EnrollmentsRepo.IsEnrolledRepository(userID, req.CourseID)
		if err == nil && isEnrolled {
			return nil, generic.ErrTransactionsAlreadyEnrolled
		}
	}

	if existing, err := s.Repos.GetPendingTransactionRepository(userID, req.CourseID); err == nil && existing != nil && existing.RazorpayOrderID != nil {
		return &entities.InitiateTransactionResponse{
			TransactionID:   existing.ID,
			RazorpayOrderID: *existing.RazorpayOrderID,
			Amount:          existing.Amount,
			Currency:        existing.Currency,
			RazorpayKey:     s.Cfg.RazorpayKeyID,
		}, nil
	}

	pricing, err := s.Repos.GetCoursePricingRepository(req.CourseID)
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
		check, coupon, err := s.CouponsS.ValidateAndFetchCouponService(*req.CouponCode, req.CourseID)
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

	taxAmount := discountedAmount * s.Cfg.TaxPercent / 100
	amount := discountedAmount + taxAmount

	amountPaise := int64(math.Round(amount * 100))
	if amountPaise < 100 {
		amountPaise = 100
	}

	txID := uuid.NewString()

	order, err := s.Rzp.CreateOrder(amountPaise, "INR", txID)
	if err != nil {
		return nil, fmt.Errorf("failed to create payment order: %w", err)
	}

	tx, err := s.Repos.CreateRepository(txID, userID, req.CourseID, couponID, order.ID, amount, pricing.ActualPrice, pricing.FinalPrice, s.Cfg.TaxPercent, discountAmount)
	if err != nil {
		return nil, fmt.Errorf("failed to persist transaction: %w", err)
	}

	return &entities.InitiateTransactionResponse{
		TransactionID:   tx.ID,
		RazorpayOrderID: order.ID,
		Amount:          amount,
		Currency:        "INR",
		RazorpayKey:     s.Cfg.RazorpayKeyID,
	}, nil
}

func (s *TransactionsService) HandleWebhookService(rawBody []byte, signature string, payload entities.WebhookPayload) error {
	if !s.Rzp.VerifyWebhookSignature(rawBody, signature) {
		return generic.ErrTransactionsInvalidSignature
	}

	alreadyProcessed, err := s.Repos.UpsertWebhookEventRepository(payload.EventID, payload.Event)
	if err != nil {
		return fmt.Errorf("failed to upsert webhook event: %w", err)
	}
	if alreadyProcessed {
		return nil
	}

	switch payload.Event {
	case "payment.captured":
		if err := s.Repos.MarkPaymentCapturedRepository(payload.PaymentID, payload.OrderID, payload.EventID); err != nil {
			return fmt.Errorf("failed to mark payment captured for order %s: %w", payload.OrderID, err)
		}

	case "payment.failed":
		if err := s.Repos.MarkPaymentFailedRepository(&payload.ErrorDescription, payload.OrderID, payload.EventID); err != nil {
			return fmt.Errorf("failed to mark payment failed for order %s: %w", payload.OrderID, err)
		}

	default:
		log.Printf("transactions: unknown webhook event %s (id=%s) — acknowledged to stop retries", payload.Event, payload.EventID)
		if err := s.Repos.MarkWebhookEventProcessedRepository(payload.EventID); err != nil {
			log.Printf("transactions: failed to mark webhook event %s processed: %v", payload.EventID, err)
		}
	}

	return nil
}
