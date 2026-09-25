package transactions

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

const maxWebhookBodyBytes = 64 * 1024

// webhookPayloadLimit rejects webhook payloads exceeding 64KB before unmarshaling.
func webhookPayloadLimit(c *fiber.Ctx) error {
	if len(c.Body()) > maxWebhookBodyBytes {
		return utils.ErrPayloadTooLarge("Payload too large", nil)
	}
	return c.Next()
}

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	// Public webhook
	router.Post("/v1/transactions/webhook", webhookPayloadLimit, a.handleWebhook)

	// Admin transactions inspection: strictly single permission PermAdminTransactionsReadAll
	adminGuard := middlewares.PermissionGuard(generic.PermAdminTransactionsReadAll)
	gAdmin := router.Group("/v1/admin/transactions", auth, adminGuard)
	gAdmin.Get("/", a.handleAdminList)
	gAdmin.Get("/refunds", a.handleAdminListRefunds)
	gAdmin.Get("/payouts", a.handleAdminPayouts)
	gAdmin.Post("/payouts/:id/settle", middlewares.ValidateUUIDParams("id"), a.handleAdminSettlePayout)

	// Tutor payouts: strictly single permission PermTutorCoursesManage
	tutorGuard := middlewares.PermissionGuard(generic.PermTutorCoursesManage)
	gTutor := router.Group("/v1/tutor/payouts", auth, tutorGuard)
	gTutor.Get("/", a.handleTutorPayouts)
	gTutor.Post("/request", a.handleTutorRequestPayout)

	// Student transactions endpoints
	gStudent := router.Group("/v1/transactions", auth)
	gStudent.Get("/", a.handleStudentList)
	gStudent.Get("/refunds/me", a.handleStudentListRefunds)
	gStudent.Post("/initiate", a.handleCreate)
	gStudent.Get("/checkout/course/:courseId", middlewares.ValidateUUIDParams("courseId"), a.handleCheckout)
	gStudent.Get("/:id/status", middlewares.ValidateUUIDParams("id"), a.handleStatus)
}
