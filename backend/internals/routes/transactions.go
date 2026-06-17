package routes

import (
	"coursehunt-backend/internals/handlers"
	"coursehunt-backend/internals/middlewares"
	"github.com/gofiber/fiber/v2"
)

func SetupTransactionsRoutes(v1, protected fiber.Router, h *handlers.TransactionHandler) {
	// Webhook is public
	v1.Post("/transactions/webhook", h.Webhook)

	transactions := protected.Group("/transactions")
	transactions.Post("/initiate", h.Initiate)
	transactions.Get("/me", h.ListOwn)
	transactions.Get("", middlewares.PermissionGuard("transactions:read"), h.List)
}
