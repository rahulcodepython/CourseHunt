package razorpay

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
)

const baseURL = "https://api.razorpay.com/v1"

// Client holds Razorpay API credentials.
type Client struct {
	KeyID         string
	Secret        string
	WebhookSecret string
}

// NewClient creates a new Razorpay API client.
func NewClient(keyID, secret, webhookSecret string) *Client {
	return &Client{KeyID: keyID, Secret: secret, WebhookSecret: webhookSecret}
}

// OrderRequest is the payload sent to Razorpay to create an order.
type OrderRequest struct {
	Amount   int64  `json:"amount"`   // in smallest currency unit (paise)
	Currency string `json:"currency"` // "INR"
	Receipt  string `json:"receipt"`  // transaction_id
}

// OrderResponse is the response from Razorpay order creation.
type OrderResponse struct {
	ID       string `json:"id"`
	Entity   string `json:"entity"`
	Amount   int64  `json:"amount"`
	Currency string `json:"currency"`
	Receipt  string `json:"receipt"`
	Status   string `json:"status"`
}

// CreateOrder calls POST /orders and returns the Razorpay order.
func (c *Client) CreateOrder(amount int64, currency, receipt string) (*OrderResponse, error) {
	payload := OrderRequest{Amount: amount, Currency: currency, Receipt: receipt}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("razorpay: marshal order: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, baseURL+"/orders", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("razorpay: new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(c.KeyID, c.Secret)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("razorpay: do request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errBody map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errBody)
		return nil, fmt.Errorf("razorpay: unexpected status %d: %v", resp.StatusCode, errBody)
	}

	var order OrderResponse
	if err := json.NewDecoder(resp.Body).Decode(&order); err != nil {
		return nil, fmt.Errorf("razorpay: decode response: %w", err)
	}
	return &order, nil
}

// VerifyWebhookSignature validates the X-Razorpay-Signature header against the raw body.
func (c *Client) VerifyWebhookSignature(rawBody []byte, signature string) bool {
	mac := hmac.New(sha256.New, []byte(c.WebhookSecret))
	mac.Write(rawBody)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}
