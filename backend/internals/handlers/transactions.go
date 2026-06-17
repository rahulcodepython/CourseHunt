package handlers

import (
	"fmt"
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/services"
	"coursehunt-backend/internals/utils"
	"github.com/gofiber/fiber/v2"
)

type TransactionHandler struct{ Svc *services.TransactionService }

func NewTransactionHandler() *TransactionHandler { return &TransactionHandler{Svc: services.NewTransactionService()} }

// POST /api/transactions/initiate
func (h *TransactionHandler) Initiate(c *fiber.Ctx) error {
	var req models.InitiateTransactionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	resp, err := h.Svc.Initiate(getUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to initiate transaction", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "transaction initiated", resp, nil)
}

// POST /api/transactions/webhook
func (h *TransactionHandler) Webhook(c *fiber.Ctx) error {
	signature := c.Get("X-Razorpay-Signature")
	if signature == "" {
		return c.Status(fiber.StatusBadRequest).SendString("missing signature")
	}

	body := c.Body()

	var payload struct {
		Event   string `json:"event"`
		Payload struct {
			Payment struct {
				Entity struct {
					ID               string `json:"id"`
					OrderID          string `json:"order_id"`
					Status           string `json:"status"`
					ErrorDescription string `json:"error_description"`
				} `json:"entity"`
			} `json:"payment"`
		} `json:"payload"`
	}

	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).SendString("invalid body")
	}

	eventID := c.Get("X-Razorpay-Event-Id")

	webhookPayload := services.WebhookPayload{
		EventID:          eventID,
		Event:            payload.Event,
		OrderID:          payload.Payload.Payment.Entity.OrderID,
		PaymentID:        payload.Payload.Payment.Entity.ID,
		Status:           payload.Payload.Payment.Entity.Status,
		ErrorDescription: payload.Payload.Payment.Entity.ErrorDescription,
	}

	if err := h.Svc.HandleWebhook(body, signature, webhookPayload); err != nil {
		// Log error but return 200 to prevent Razorpay from retrying unless it's a critical DB issue
		fmt.Printf("Webhook error: %v\n", err)
		if err.Error() == "invalid signature" {
			return c.Status(fiber.StatusUnauthorized).SendString("invalid signature")
		}
	}

	return c.SendStatus(fiber.StatusOK)
}

// GET /api/transactions
func (h *TransactionHandler) List(c *fiber.Ctx) error {
	page, limit := paginationParams(c)
	list, total, err := h.Svc.List(page, limit, c.Query("user_id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch transactions", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "transactions fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// GET /api/transactions/me
func (h *TransactionHandler) ListOwn(c *fiber.Ctx) error {
	page, limit := paginationParams(c)
	list, total, err := h.Svc.List(page, limit, getUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch your transactions", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "transactions fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}
