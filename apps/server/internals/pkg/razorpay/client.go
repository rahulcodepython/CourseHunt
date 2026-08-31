package razorpay

import (
	"bytes"
	"context"
	"coursehunt/server/internals/generic"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

var httpClient = &http.Client{Timeout: 30 * time.Second}

// ── Types (moved to generic/type.go) ──

type Client generic.RazorpayClient
type OrderRequest = generic.RazorpayOrderRequest
type OrderResponse = generic.RazorpayOrderResponse
type RefundResponse = generic.RazorpayRefundResponse
type WebhookPayload = generic.RazorpayWebhookPayload

// ── Constructor ──

func NewClient(keyID, secret, webhookSecret, baseURL string) *Client {
	return &Client{KeyID: keyID, Secret: secret, WebhookSecret: webhookSecret, BaseURL: baseURL}
}

// ── Public Methods ──

func (c *Client) CreateOrder(ctx context.Context, amount int64, currency, receipt string) (*OrderResponse, error) {
	payload := OrderRequest{Amount: amount, Currency: currency, Receipt: receipt}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("razorpay: marshal order: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.BaseURL+"/orders", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("razorpay: new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(c.KeyID, c.Secret)

	resp, err := httpClient.Do(req)
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

func (c *Client) VerifyWebhookSignature(rawBody []byte, signature string) bool {
	mac := hmac.New(sha256.New, []byte(c.WebhookSecret))
	mac.Write(rawBody)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

func (c *Client) RefundPayment(ctx context.Context, paymentID string) (*RefundResponse, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.BaseURL+"/payments/"+paymentID+"/refund", bytes.NewReader([]byte("{}")))
	if err != nil {
		return nil, fmt.Errorf("razorpay: new refund request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(c.KeyID, c.Secret)

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("razorpay: do refund request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		var errBody map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errBody)
		return nil, fmt.Errorf("razorpay: unexpected refund status %d: %v", resp.StatusCode, errBody)
	}

	var refund RefundResponse
	if err := json.NewDecoder(resp.Body).Decode(&refund); err != nil {
		return nil, fmt.Errorf("razorpay: decode refund response: %w", err)
	}
	return &refund, nil
}
