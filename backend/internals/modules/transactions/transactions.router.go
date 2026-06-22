package transactions

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *TransactionsModule) Routes(v1, protected fiber.Router) {
	// Webhook is public
	v1.Post("/transactions/webhook", m.WebhookController)

	transactions := protected.Group("/transactions")
	transactions.Post("/initiate", m.CreateController)
	transactions.Get("/me", m.ListOwnController)
	transactions.Get("", middlewares.PermissionGuard("transactions:read"), m.ListController)
}
