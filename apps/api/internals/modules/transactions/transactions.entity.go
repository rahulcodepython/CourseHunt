package transactions

import (
	"coursehunt-backend/internals/models"
	"time"
)

type Transaction struct {
	ID                string            `json:"id"`
	User              models.UserInfo   `json:"user"`
	Course            models.CourseInfo `json:"course"`
	Coupon            models.CouponInfo `json:"coupon"`
	RazorpayOrderID   *string           `json:"razorpay_order_id"`
	RazorpayPaymentID *string           `json:"razorpay_payment_id"`
	Amount            float64           `json:"amount"`
	Currency          string            `json:"currency"`
	Status            string            `json:"status"`
	ErrorDescription  *string           `json:"error_description"`
	ConfirmedAt       *time.Time        `json:"confirmed_at"`
	CreatedAt         time.Time         `json:"created_at"`
}

type InitiateTransactionRequest struct {
	CourseID   string  `json:"course_id" validate:"required,uuid"`
	CouponCode *string `json:"coupon_code"`
}

// ── Transaction Response ──

type InitiateTransactionResponse struct {
	TransactionID   string  `json:"transaction_id"`
	RazorpayOrderID string  `json:"razorpay_order_id"`
	Amount          float64 `json:"amount"`
	Currency        string  `json:"currency"`
	RazorpayKey     string  `json:"razorpay_key"`
}

type WebhookPayload struct {
	EventID          string
	Event            string
	OrderID          string
	PaymentID        string
	Status           string
	ErrorDescription string
}
