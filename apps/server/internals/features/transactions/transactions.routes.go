package transactions

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	// Public webhook
	router.Post("/v1/transactions/webhook", func(c *fiber.Ctx) error {
		if len(c.Body()) > 64*1024 {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{"error": "Payload too large"})
		}
		return c.Next()
	}, a.handleWebhook)

	// Admin transactions inspection: strictly single permission PermAdminTransactionsReadAll
	adminGuard := middlewares.PermissionGuard(generic.PermAdminTransactionsReadAll)
	gAdmin := router.Group("/v1/admin/transactions", auth, adminGuard)
	gAdmin.Get("/", a.handleAdminList)
	gAdmin.Get("/refunds", a.handleAdminListRefunds)

	// Student transactions endpoints
	gStudent := router.Group("/v1/transactions", auth)
	gStudent.Get("/", a.handleStudentList)
	gStudent.Get("/refunds/me", a.handleStudentListRefunds)
	gStudent.Post("/initiate", a.handleCreate)
	gStudent.Get("/checkout/course/:courseId", a.handleCheckout)
	gStudent.Get("/:id/status", a.handleStatus)
}
