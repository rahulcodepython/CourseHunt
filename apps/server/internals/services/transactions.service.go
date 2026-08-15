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
	Repos    *repositories.TransactionsRepository
	Cfg      *config.Config
	Rzp      *razorpay.Client
	CouponsS *CouponsService
}

func NewTransactionsService(repos *repositories.TransactionsRepository, cfg *config.Config, rzp *razorpay.Client, couponsS *CouponsService) *TransactionsService {
	return &TransactionsService{Repos: repos, Cfg: cfg, Rzp: rzp, CouponsS: couponsS}
}

func (s *TransactionsService) InitiateService(userID string, req entities.InitiateTransactionRequest) (*entities.InitiateTransactionResponse, error) {
	amount, err := s.Repos.GetCoursePriceRepository(req.CourseID)
	if err != nil {
		return nil, generic.ErrCoursesCourseNotFound
	}

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
			discount := amount * check.DiscountPercent / 100
			amount -= discount
			if amount < 0 {
				amount = 0
			}
			couponID = &coupon.ID
		}
	}

	amountPaise := int64(math.Round(amount * 100))
	if amountPaise < 100 {
		amountPaise = 100
	}

	txID := uuid.NewString()

	order, err := s.Rzp.CreateOrder(amountPaise, "INR", txID)
	if err != nil {
		return nil, fmt.Errorf("failed to create payment order: %w", err)
	}

	tx, err := s.Repos.CreateRepository(txID, userID, req.CourseID, couponID, order.ID, amount)
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
