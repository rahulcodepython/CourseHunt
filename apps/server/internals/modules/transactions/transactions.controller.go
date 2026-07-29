package transactions

import (
	"log"
	"strings"

	"coursehunt/api/internals/generic"
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
		return utils.BadRequest(c, "missing signature", nil)
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
		return utils.BadRequest(c, "invalid body", err)
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
		log.Printf("Webhook error: %v", err)
		if err.Error() == "invalid signature" {
			return utils.Unauthorized(c, "invalid signature", err)
		}
		return utils.InternalError(c, "Webhook processing failed", err)
	}

	return utils.OK[any](c, "Webhook processed", nil)
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
	permission, _ := c.Locals("permission").(string)

	if strings.HasPrefix(permission, "admin:") {
		list, total, err := m.ListRepository(c.Context(), page, limit, c.Query("user_id"), "", c.Query("status"), c.Query("course_id"), c.Query("date_from"), c.Query("date_to"))
		if err != nil {
			return utils.InternalError(c, "Failed to fetch transactions.", err)
		}
		return utils.OK(c, "Transactions fetched.", generic.PaginatedResponse[[]Transaction]{
			Data: list, Total: total, Page: page, Limit: limit,
		})
	}

	list, total, err := m.ListRepository(c.Context(), page, limit, utils.GetUserID(c), "", "", "", "", "")
	if err != nil {
		return utils.InternalError(c, "Failed to fetch your transactions.", err)
	}
	return utils.OK(c, "Your transactions fetched.", generic.PaginatedResponse[[]Transaction]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
