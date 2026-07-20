package transactions

import (
	"fmt"

	"coursehunt/api/internals/models"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *TransactionsModule) CreateController(c *fiber.Ctx) error {
	var req InitiateTransactionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	resp, err := m.InitiateService(c.Context(), utils.GetUserID(c), req)
	if err != nil {
		return utils.InternalError(c, "Failed to initiate transaction.", err)
	}
	return utils.Created(c, "Transaction initiated.", resp)
}

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

	if err := m.HandleWebhookService(c.Context(), body, signature, webhookPayload); err != nil {
		fmt.Printf("Webhook error: %v\n", err)
		if err.Error() == "invalid signature" {
			return c.Status(fiber.StatusUnauthorized).SendString("invalid signature")
		}
	}

	return c.SendStatus(fiber.StatusOK)
}

func (m *TransactionsModule) StatusController(c *fiber.Ctx) error {
	resp, err := m.GetTransactionStatusRepository(c.Context(), c.Params("id"), utils.GetUserID(c))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch transaction status.", err)
	}
	return utils.OK(c, "Transaction status fetched.", resp)
}

func (m *TransactionsModule) CheckoutController(c *fiber.Ctx) error {
	courseID := c.Params("courseId")
	resp, err := m.GetCheckoutCourseRepository(c.Context(), courseID)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch checkout course info.", err)
	}
	return utils.OK(c, "Checkout course info fetched.", resp)
}

func (m *TransactionsModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(c.Context(), page, limit, c.Query("user_id"), "", c.Query("status"), c.Query("course_id"), c.Query("date_from"), c.Query("date_to"))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch transactions.", err)
	}
	return utils.OK(c, "Transactions fetched.", models.PaginatedResponse[[]Transaction]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *TransactionsModule) ListOwnController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(c.Context(), page, limit, utils.GetUserID(c), "", "", "", "", "")
	if err != nil {
		return utils.InternalError(c, "Failed to fetch your transactions.", err)
	}
	return utils.OK(c, "Your transactions fetched.", models.PaginatedResponse[[]Transaction]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
