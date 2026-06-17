package services

import (
	"fmt"

	"coursehunt-backend/internals/config"
	"coursehunt-backend/internals/models"
	razorpaypkg "coursehunt-backend/internals/pkg/razorpay"
	"coursehunt-backend/internals/repositories"
)

type TransactionService struct {
	Transactions *repositories.TransactionRepository
	Coupons      *repositories.CouponRepository
	Enrollments  *repositories.EnrollmentRepository
	Courses      *repositories.CourseRepository
	Razorpay     *razorpaypkg.Client
}

func NewTransactionService() *TransactionService {
	cfg := config.CFG
	return &TransactionService{
		Transactions: repositories.NewTransactionRepository(),
		Coupons:      repositories.NewCouponRepository(),
		Enrollments:  repositories.NewEnrollmentRepository(),
		Courses:      repositories.NewCourseRepository(),
		Razorpay:     razorpaypkg.NewClient(cfg.RazorpayKeyID, cfg.RazorpaySecret, cfg.RazorpayWebhookSecret),
	}
}

func (s *TransactionService) Initiate(userID string, req models.InitiateTransactionRequest) (*models.InitiateTransactionResponse, error) {
	course, err := s.Courses.FindByID(req.CourseID)
	if err != nil {
		return nil, fmt.Errorf("course not found")
	}

	amount := course.FinalPrice
	var couponID *string

	if req.CouponCode != nil && *req.CouponCode != "" {
		check := s.Coupons.Check(*req.CouponCode, req.CourseID)
		if !check.Valid {
			reason := "invalid coupon"
			if check.Reason != nil {
				reason = *check.Reason
			}
			return nil, fmt.Errorf(reason)
		}
		coupon, _ := s.Coupons.FindByCode(*req.CouponCode)
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

	// Create pending transaction first to get a receipt
	tx, err := s.Transactions.Create(userID, req.CourseID, couponID, "", amount)
	if err != nil {
		return nil, err
	}

	order, err := s.Razorpay.CreateOrder(amountPaise, "INR", tx.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to create payment order: %w", err)
	}

	// Store Razorpay order ID
	s.Transactions.DB.Exec(`UPDATE transactions SET razorpay_order_id = $1 WHERE id = $2`, order.ID, tx.ID)

	return &models.InitiateTransactionResponse{
		TransactionID:   tx.ID,
		RazorpayOrderID: order.ID,
		Amount:          amount,
		Currency:        "INR",
		RazorpayKey:     config.CFG.RazorpayKeyID,
	}, nil
}

// HandleWebhook processes Razorpay webhook events with idempotency.
func (s *TransactionService) HandleWebhook(rawBody []byte, signature string, payload WebhookPayload) error {
	if !s.Razorpay.VerifyWebhookSignature(rawBody, signature) {
		return fmt.Errorf("invalid signature")
	}

	// Idempotency check
	if s.Transactions.WebhookEventExists(payload.EventID) {
		return nil
	}
	s.Transactions.StoreWebhookEvent(payload.EventID, payload.Event)

	tx, err := s.Transactions.FindByRazorpayOrderID(payload.OrderID)
	if err != nil {
		return fmt.Errorf("transaction not found for order %s", payload.OrderID)
	}

	switch payload.Event {
	case "payment.captured":
		if err := s.Transactions.MarkSuccess(tx.ID, payload.PaymentID); err != nil {
			return err
		}
		// Register coupon usage
		if tx.CouponID != nil && tx.UserID != nil && tx.CourseID != nil {
			s.Coupons.RecordUsage(*tx.CouponID, *tx.UserID, *tx.CourseID)
		}
		// Enroll user
		if tx.UserID != nil && tx.CourseID != nil {
			s.Enrollments.Enroll(*tx.UserID, *tx.CourseID)
		}
	case "payment.failed":
		s.Transactions.MarkFailed(tx.ID, &payload.ErrorDescription)
	}
	return nil
}

// WebhookPayload is the parsed Razorpay webhook body.
type WebhookPayload struct {
	EventID          string
	Event            string
	OrderID          string
	PaymentID        string
	Status           string
	ErrorDescription string
}

func (s *TransactionService) List(page, limit int, userID string) ([]models.Transaction, int, error) {
	return s.Transactions.List(page, limit, userID)
}
