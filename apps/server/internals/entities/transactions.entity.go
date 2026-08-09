package entities

import (
	"time"

	"coursehunt/server/internals/generic"
)

type Transaction struct {
	ID                string            `json:"id"`
	User              generic.UserInfo   `json:"user"`
	Course            generic.CourseInfo `json:"course"`
	Coupon            generic.CouponInfo `json:"coupon"`
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

// ── Checkout Course Response ──

type CheckoutCourseResponse struct {
	ID          string                 `json:"id"`
	Title       string                 `json:"title"`
	ImageURL    *string                `json:"image_url"`
	Instructor  generic.InstructorInfo `json:"instructor" db:"instructor"`
	ActualPrice float64                `json:"actual_price"`
	FinalPrice  float64                `json:"final_price"`
}

// ── Transaction Status Response ──

type TransactionStatusResponse struct {
	ID               string  `json:"id"`
	Status           string  `json:"status"`
	ErrorDescription *string `json:"error_description,omitempty"`
	WebhookProcessed bool    `json:"webhook_processed"`
	RazorpayOrderID  *string `json:"razorpay_order_id"`
}

type WebhookPayload struct {
	EventID          string
	Event            string
	OrderID          string
	PaymentID        string
	Status           string
	ErrorDescription string
}
