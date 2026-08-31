package transactions

import (
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/pkg/razorpay"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleCreate(c *fiber.Ctx) error {
	var req InitiateTransactionRequest
	if err := utils.BindAndValidate(c, &req); err != nil {
		return err
	}

	resp, err := a.Initiate(c.Context(), middlewares.UserID(c), req)
	if err != nil {
		return err
	}
	return utils.Created(c, generic.MsgTransactionInitiated, resp)
}

func (a *App) handleWebhook(c *fiber.Ctx) error {
	signature := c.Get("X-Razorpay-Signature")
	if signature == "" {
		return utils.ErrBadRequest("missing signature", nil)
	}

	body := c.Body()

	var raw razorpay.WebhookPayload
	if err := c.BodyParser(&raw); err != nil {
		return utils.ErrBadRequest("invalid body", err)
	}

	paymentID := raw.Payload.Payment.Entity.ID
	if paymentID == "" {
		paymentID = raw.Payload.Refund.Entity.PaymentID
	}

	webhookPayload := WebhookPayload{
		EventID:          c.Get("X-Razorpay-Event-Id"),
		Event:            raw.Event,
		OrderID:          raw.Payload.Payment.Entity.OrderID,
		PaymentID:        paymentID,
		RefundID:         raw.Payload.Refund.Entity.ID,
		Status:           raw.Payload.Payment.Entity.Status,
		ErrorDescription: raw.Payload.Payment.Entity.ErrorDescription,
	}

	if err := a.HandleWebhook(c.Context(), body, signature, webhookPayload); err != nil {
		return err
	}

	return utils.OK[any](c, "Webhook processed", nil)
}

func (a *App) handleStatus(c *fiber.Ctx) error {
	resp, err := a.Status(c.Context(), c.Params("id"), middlewares.UserID(c))
	if err != nil {
		return err
	}
	return utils.OK(c, "Transaction status fetched.", resp)
}

func (a *App) handleCheckout(c *fiber.Ctx) error {
	resp, err := a.Checkout(c.Context(), c.Params("courseId"))
	if err != nil {
		return err
	}
	return utils.OK(c, "Checkout course info fetched.", resp)
}

func (a *App) handleList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	scope := middlewares.ResolveScope(c)

	if scope == generic.ScopeAdmin {
		status := c.Query("status")
		validStatuses := map[string]bool{"pending": true, "success": true, "failed": true, "duplicate": true, "refunded": true}
		if status != "" && !validStatuses[status] {
			return utils.ErrBadRequest(generic.ErrMsgInvalidStatusParam, nil)
		}

		dateFrom := c.Query("date_from")
		if dateFrom != "" {
			if _, err := time.Parse(time.RFC3339, dateFrom); err != nil {
				return utils.ErrBadRequest(generic.ErrMsgInvalidDateFrom, nil)
			}
		}

		dateTo := c.Query("date_to")
		if dateTo != "" {
			if _, err := time.Parse(time.RFC3339, dateTo); err != nil {
				return utils.ErrBadRequest(generic.ErrMsgInvalidDateTo, nil)
			}
		}

		list, total, err := a.List(c.Context(), page, limit, c.Query("user_id"), "", status, c.Query("course_id"), dateFrom, dateTo, "Failed to fetch transactions.")
		if err != nil {
			return err
		}
		return utils.OK(c, generic.MsgTransactionsFetched, generic.PaginatedResponse[[]Transaction]{
			Data: list, Total: total, Page: page, Limit: limit,
		})
	}

	list, total, err := a.List(c.Context(), page, limit, middlewares.UserID(c), "", "", "", "", "", "Failed to fetch your transactions.")
	if err != nil {
		return err
	}
	return utils.OK(c, "Your transactions fetched.", generic.PaginatedResponse[[]Transaction]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (a *App) handleListRefunds(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	scope := middlewares.ResolveScope(c)

	var targetUserID string
	if scope == generic.ScopeAdmin {
		targetUserID = c.Query("user_id")
	} else {
		targetUserID = middlewares.UserID(c)
	}

	status := c.Query("status")
	validStatuses := map[string]bool{"pending": true, "processed": true, "failed": true}
	if status != "" && !validStatuses[status] {
		return utils.ErrBadRequest(generic.ErrMsgInvalidStatusParam, nil)
	}

	dateFrom := c.Query("date_from")
	if dateFrom != "" {
		if _, err := time.Parse(time.RFC3339, dateFrom); err != nil {
			return utils.ErrBadRequest(generic.ErrMsgInvalidDateFrom, nil)
		}
	}

	dateTo := c.Query("date_to")
	if dateTo != "" {
		if _, err := time.Parse(time.RFC3339, dateTo); err != nil {
			return utils.ErrBadRequest(generic.ErrMsgInvalidDateTo, nil)
		}
	}

	list, total, err := a.ListRefunds(c.Context(), page, limit, targetUserID, status, c.Query("course_id"), dateFrom, dateTo, "Failed to fetch refunds.")
	if err != nil {
		return err
	}

	return utils.OK(c, "Refunds fetched successfully.", generic.PaginatedResponse[[]RefundTransaction]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
