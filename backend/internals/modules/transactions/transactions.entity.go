package transactions

import "time"

type Transaction struct {
	ID                string     `json:"id"`
	UserID            *string    `json:"user_id"`
	CourseID          *string    `json:"course_id"`
	CouponID          *string    `json:"coupon_id"`
	RazorpayOrderID   *string    `json:"razorpay_order_id"`
	RazorpayPaymentID *string    `json:"razorpay_payment_id"`
	Amount            float64    `json:"amount"`
	Currency          string     `json:"currency"`
	Status            string     `json:"status"`
	ErrorDescription  *string    `json:"error_description"`
	ConfirmedAt       *time.Time `json:"confirmed_at"`
	CreatedAt         time.Time  `json:"created_at"`
}

type WebhookEvent struct {
	ID              string    `json:"id"`
	RazorpayEventID string    `json:"razorpay_event_id"`
	EventType       string    `json:"event_type"`
	Processed       bool      `json:"processed"`
	ReceivedAt      time.Time `json:"received_at"`
}
