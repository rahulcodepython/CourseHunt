package controllers

import (
	"errors"
	"log"
	"strings"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/razorpay"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/services"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type TransactionsController struct {
	Svc  *services.TransactionsService
	Repo *repositories.TransactionsRepository
	Cfg  *config.Config
}

func NewTransactionsController(svc *services.TransactionsService, repo *repositories.TransactionsRepository, cfg *config.Config) *TransactionsController {
	return &TransactionsController{Svc: svc, Repo: repo, Cfg: cfg}
}

func (ctrl *TransactionsController) CreateController(c *fiber.Ctx) error {
	var req entities.InitiateTransactionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}

	resp, err := ctrl.Svc.InitiateService(utils.GetUserID(c), req)
	if err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return utils.NotFound(c, "Course not found.", err)
		}
		if errors.Is(err, generic.ErrTransactionsInvalidCoupon) {
			return utils.BadRequest(c, "Invalid coupon.", err)
		}
		if errors.Is(err, generic.ErrTransactionsAlreadyEnrolled) {
			return utils.BadRequest(c, generic.ErrMsgAlreadyEnrolled, err)
		}
		if errors.Is(err, generic.ErrTransactionsCourseIsFree) {
			return utils.BadRequest(c, generic.ErrMsgFreeCourseDirect, err)
		}
		return utils.InternalError(c, "Failed to initiate transaction.", err)
	}
	return utils.Created(c, generic.MsgTransactionInitiated, resp)
}

func (ctrl *TransactionsController) WebhookController(c *fiber.Ctx) error {
	signature := c.Get("X-Razorpay-Signature")
	if signature == "" {
		return utils.BadRequest(c, "missing signature", nil)
	}

	body := c.Body()

	var raw razorpay.WebhookPayload
	if err := c.BodyParser(&raw); err != nil {
		return utils.BadRequest(c, "invalid body", err)
	}

	webhookPayload := entities.WebhookPayload{
		EventID:          c.Get("X-Razorpay-Event-Id"),
		Event:            raw.Event,
		OrderID:          raw.Payload.Payment.Entity.OrderID,
		PaymentID:        raw.Payload.Payment.Entity.ID,
		Status:           raw.Payload.Payment.Entity.Status,
		ErrorDescription: raw.Payload.Payment.Entity.ErrorDescription,
	}

	if err := ctrl.Svc.HandleWebhookService(body, signature, webhookPayload); err != nil {
		log.Printf("Webhook error: %v", err)
		if errors.Is(err, generic.ErrTransactionsInvalidSignature) {
			return utils.Unauthorized(c, "invalid signature", err)
		}
		return utils.InternalError(c, "Webhook processing failed", err)
	}

	return utils.OK[any](c, "Webhook processed", nil)
}

func (ctrl *TransactionsController) StatusController(c *fiber.Ctx) error {
	resp, err := ctrl.Repo.GetTransactionStatusRepository(c.Params("id"), utils.GetUserID(c))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch transaction status.", err)
	}
	return utils.OK(c, "Transaction status fetched.", resp)
}

func (ctrl *TransactionsController) CheckoutController(c *fiber.Ctx) error {
	courseID := c.Params("courseId")
	resp, err := ctrl.Repo.GetCheckoutCourseRepository(courseID)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch checkout course info.", err)
	}
	// Informational only — the authoritative amount (and tax) is always
	// (re)computed server-side in InitiateService, never trusted from here.
	resp.TaxPercent = ctrl.Cfg.TaxPercent
	return utils.OK(c, "Checkout course info fetched.", resp)
}

func (ctrl *TransactionsController) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	permission, _ := c.Locals("permission").(string)

	if strings.HasPrefix(permission, "admin:") {
		status := c.Query("status")
		validStatuses := map[string]bool{"pending": true, "success": true, "failed": true}
		if status != "" && !validStatuses[status] {
			return utils.BadRequest(c, generic.ErrMsgInvalidStatusParam, nil)
		}

		dateFrom := c.Query("date_from")
		if dateFrom != "" {
			if _, err := time.Parse(time.RFC3339, dateFrom); err != nil {
				return utils.BadRequest(c, generic.ErrMsgInvalidDateFrom, nil)
			}
		}

		dateTo := c.Query("date_to")
		if dateTo != "" {
			if _, err := time.Parse(time.RFC3339, dateTo); err != nil {
				return utils.BadRequest(c, generic.ErrMsgInvalidDateTo, nil)
			}
		}

		list, total, err := ctrl.Repo.ListRepository(page, limit, c.Query("user_id"), "", status, c.Query("course_id"), dateFrom, dateTo)
		if err != nil {
			return utils.InternalError(c, "Failed to fetch transactions.", err)
		}
		return utils.OK(c, generic.MsgTransactionsFetched, generic.PaginatedResponse[[]entities.Transaction]{
			Data: list, Total: total, Page: page, Limit: limit,
		})
	}

	list, total, err := ctrl.Repo.ListRepository(page, limit, utils.GetUserID(c), "", "", "", "", "")
	if err != nil {
		return utils.InternalError(c, "Failed to fetch your transactions.", err)
	}
	return utils.OK(c, "Your transactions fetched.", generic.PaginatedResponse[[]entities.Transaction]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
