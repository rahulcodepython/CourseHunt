package transactions

import (
	"time"

	"coursehunt/server/internals/generic"
)

type Transaction struct {
	ID                string             `json:"id" db:"id"`
	User              generic.UserInfo   `json:"user" db:"user"`
	Course            generic.CourseInfo `json:"course" db:"course"`
	Coupon            generic.CouponInfo `json:"coupon" db:"coupon"`
	RazorpayOrderID   *string            `json:"razorpay_order_id" db:"razorpay_order_id"`
	RazorpayPaymentID *string            `json:"razorpay_payment_id" db:"razorpay_payment_id"`
	Amount            float64            `json:"amount" db:"amount"`
	ActualPrice       float64            `json:"actual_price" db:"actual_price"`
	OfferedPrice      float64            `json:"offered_price" db:"offered_price"`
	TaxPercent        float64            `json:"tax_percent" db:"tax_percent"`
	DiscountAmount    float64            `json:"discount_amount" db:"discount_amount"`
	Currency          string             `json:"currency" db:"currency"`
	Status            string             `json:"status" db:"status"`
	ErrorDescription  *string            `json:"error_description" db:"error_description"`
	ConfirmedAt       *time.Time         `json:"confirmed_at" db:"confirmed_at"`
	CreatedAt         time.Time          `json:"created_at" db:"created_at"`
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
	ID          string                 `json:"id" db:"id"`
	Title       string                 `json:"title" db:"title"`
	ImageURL    *string                `json:"image_url" db:"image_url"`
	Instructor  generic.InstructorInfo `json:"instructor" db:"instructor"`
	ActualPrice float64                `json:"actual_price" db:"actual_price"`
	FinalPrice  float64                `json:"final_price" db:"final_price"`
	IsFree      bool                   `json:"is_free" db:"is_free"`
	TaxPercent  float64                `json:"tax_percent" db:"-"`
}

// ── Transaction Status Response ──

type TransactionStatusResponse struct {
	ID               string  `json:"id" db:"id"`
	Status           string  `json:"status" db:"status"`
	ErrorDescription *string `json:"error_description,omitempty" db:"error_description"`
	WebhookProcessed bool    `json:"webhook_processed" db:"webhook_processed"`
	RazorpayOrderID  *string `json:"razorpay_order_id" db:"razorpay_order_id"`
}

type WebhookPayload struct {
	EventID          string
	Event            string
	OrderID          string
	PaymentID        string
	RefundID         string
	Status           string
	ErrorDescription string
}

type RefundTransaction struct {
	ID                string             `json:"id" db:"id"`
	TransactionID     string             `json:"transaction_id" db:"transaction_id"`
	DuplicateOf       *string            `json:"duplicate_of" db:"duplicate_of"`
	User              generic.UserInfo   `json:"user" db:"user"`
	Course            generic.CourseInfo `json:"course" db:"course"`
	Amount            float64            `json:"amount" db:"amount"`
	Currency          string             `json:"currency" db:"currency"`
	Reason            string             `json:"reason" db:"reason"`
	RefundStatus      string             `json:"refund_status" db:"refund_status"`
	RazorpayRefundID  *string            `json:"razorpay_refund_id" db:"razorpay_refund_id"`
	RazorpayPaymentID *string            `json:"razorpay_payment_id" db:"razorpay_payment_id"`
	ErrorDescription  *string            `json:"error_description" db:"error_description"`
	CreatedAt         time.Time          `json:"created_at" db:"created_at"`
	RefundedAt        *time.Time         `json:"refunded_at" db:"refunded_at"`
}

type RefundListPayload struct {
	Total int                 `json:"total"`
	Data  []RefundTransaction `json:"data"`
}
