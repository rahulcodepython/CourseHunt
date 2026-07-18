package transactions

import (
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *TransactionsModule) Routes(v1, protected fiber.Router) {
	// Webhook is public
	v1.Post("/transactions/webhook", m.WebhookController)

	transactions := protected.Group("/transactions")
	transactions.Post("/initiate", middlewares.PermissionGuard("transactions:initiate"), m.CreateController)
	transactions.Get("/me", middlewares.PermissionGuard("transactions:read_own"), m.ListOwnController)
	transactions.Get("", middlewares.PermissionGuard("transactions:read_all"), m.ListController)
}
