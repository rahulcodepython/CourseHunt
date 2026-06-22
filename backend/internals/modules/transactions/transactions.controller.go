package transactions

import (
	"fmt"
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// POST /api/transactions/initiate
func (m *TransactionsModule) CreateController(c *fiber.Ctx) error {
	var req InitiateTransactionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	resp, err := m.InitiateService(getUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to initiate transaction", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "transaction initiated", resp, nil)
}

// POST /api/transactions/webhook
func (m *TransactionsModule) WebhookController(c *fiber.Ctx) error {
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

	webhookPayload := WebhookPayload{
		EventID:          eventID,
		Event:            payload.Event,
		OrderID:          payload.Payload.Payment.Entity.OrderID,
		PaymentID:        payload.Payload.Payment.Entity.ID,
		Status:           payload.Payload.Payment.Entity.Status,
		ErrorDescription: payload.Payload.Payment.Entity.ErrorDescription,
	}

	if err := m.HandleWebhookService(body, signature, webhookPayload); err != nil {
		// Log error but return 200 to prevent Razorpay from retrying unless it's a critical DB issue
		fmt.Printf("Webhook error: %v\n", err)
		if err.Error() == "invalid signature" {
			return c.Status(fiber.StatusUnauthorized).SendString("invalid signature")
		}
	}

	return c.SendStatus(fiber.StatusOK)
}

// GET /api/transactions
func (m *TransactionsModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListService(page, limit, c.Query("user_id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch transactions", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "transactions fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

// GET /api/transactions/me
func (m *TransactionsModule) ListOwnController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListService(page, limit, getUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch your transactions", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "transactions fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}

func getUserID(c *fiber.Ctx) string {
	val := c.Locals("user_id")
	if val == nil {
		return ""
	}
	return val.(string)
}
