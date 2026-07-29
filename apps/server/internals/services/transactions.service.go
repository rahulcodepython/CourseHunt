package services

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"log"
	"math"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/pkg/razorpay"
	"coursehunt/server/internals/repositories"

	"github.com/jmoiron/sqlx"
)

type TransactionsService struct {
	DB       *sqlx.DB
	Repos    *repositories.TransactionsRepository
	Cfg      *config.Config
	Rzp      *razorpay.Client
	CouponsS *CouponsService
	EnrlRepo *repositories.EnrollmentsRepository
}

func NewTransactionsService(db *sqlx.DB, repos *repositories.TransactionsRepository, cfg *config.Config, rzp *razorpay.Client, couponsS *CouponsService, enrlRepo *repositories.EnrollmentsRepository) *TransactionsService {
	return &TransactionsService{DB: db, Repos: repos, Cfg: cfg, Rzp: rzp, CouponsS: couponsS, EnrlRepo: enrlRepo}
}

func newTransactionID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16]), nil
}

func (s *TransactionsService) InitiateService(ctx context.Context, userID string, req entities.InitiateTransactionRequest) (*entities.InitiateTransactionResponse, error) {
	amount, err := s.Repos.GetCoursePriceRepository(ctx, req.CourseID)
	if err != nil {
		return nil, fmt.Errorf("course not found")
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
	if amountPaise < 100 {
		amountPaise = 100
	}

	txID, err := newTransactionID()
	if err != nil {
		return nil, fmt.Errorf("failed to generate transaction id: %w", err)
	}

	order, err := s.Rzp.CreateOrder(amountPaise, "INR", txID)
	if err != nil {
		return nil, fmt.Errorf("failed to create payment order: %w", err)
	}

	tx, err := s.Repos.CreateRepository(ctx, txID, userID, req.CourseID, couponID, order.ID, amount)
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

func (s *TransactionsService) HandleWebhookService(ctx context.Context, rawBody []byte, signature string, payload entities.WebhookPayload) error {
	if !s.Rzp.VerifyWebhookSignature(rawBody, signature) {
		return fmt.Errorf("invalid signature")
	}

	alreadyProcessed, err := s.Repos.UpsertWebhookEventRepository(ctx, payload.EventID, payload.Event)
	if err != nil {
		return fmt.Errorf("failed to upsert webhook event: %w", err)
	}
	if alreadyProcessed {
		return nil
	}

	tx, err := s.Repos.FindByRazorpayOrderIDRepository(ctx, payload.OrderID)
	if err != nil {
		return fmt.Errorf("transaction not found for order %s: %w", payload.OrderID, err)
	}

	switch payload.Event {
	case "payment.captured":
		if err := s.Repos.MarkSuccessAndWebhookProcessedRepository(ctx, tx.ID, payload.PaymentID, payload.EventID); err != nil {
			return fmt.Errorf("failed to mark transaction success: %w", err)
		}

		if tx.Coupon.ID != "" && tx.User.ID != "" && tx.Course.ID != "" {
			if err := s.Repos.CouponsRepo.RecordUsageRepository(tx.Coupon.ID, tx.User.ID, tx.Course.ID); err != nil {
				return fmt.Errorf("failed to record coupon usage for tx %s: %w", tx.ID, err)
			}
		}
		if tx.User.ID != "" && tx.Course.ID != "" {
			if err := s.EnrlRepo.EnrollRepository(tx.User.ID, tx.Course.ID); err != nil {
				return fmt.Errorf("failed to enroll user for tx %s: %w", tx.ID, err)
			}
		}

	case "payment.failed":
		if err := s.Repos.MarkFailedAndWebhookProcessedRepository(ctx, tx.ID, &payload.ErrorDescription, payload.EventID); err != nil {
			return fmt.Errorf("failed to mark transaction failed: %w", err)
		}

	default:
		log.Printf("transactions: unknown webhook event %s (id=%s) — acknowledged to stop retries", payload.Event, payload.EventID)
		if err := s.Repos.MarkWebhookEventProcessedRepository(ctx, payload.EventID); err != nil {
			log.Printf("transactions: failed to mark webhook event %s processed: %v", payload.EventID, err)
		}
	}

	return nil
}
