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

type WebhookEvent struct {
	ID              string    `json:"id"`
	RazorpayEventID string    `json:"razorpay_event_id"`
	EventType       string    `json:"event_type"`
	Processed       bool      `json:"processed"`
	ReceivedAt      time.Time `json:"received_at"`
}
