package transactions

// ── Transactions ──

type InitiateTransactionRequest struct {
	CourseID   string  `json:"course_id" validate:"required,uuid"`
	CouponCode *string `json:"coupon_code"`
}

type ManualEnrollRequest struct {
	UserID string `json:"user_id" validate:"required"`
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
