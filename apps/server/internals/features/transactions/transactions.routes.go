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

	g := router.Group("/v1/transactions", auth)
	g.Post("/initiate", a.handleCreate)
	g.Get("/checkout/course/:courseId", a.handleCheckout)
	g.Get("/:id/status", a.handleStatus)
	g.Get("/", middlewares.ScopeGuard(generic.PermAdminTransactionsReadAll), a.handleList)
}
