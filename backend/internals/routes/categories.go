package routes

import (
	"coursehunt-backend/internals/handlers"
	"coursehunt-backend/internals/middlewares"
	"github.com/gofiber/fiber/v2"
)

func SetupCategoriesRoutes(v1, protected fiber.Router, h *handlers.CategoryHandler) {
	v1.Get("/categories", h.List)

	categories := protected.Group("/categories", middlewares.PermissionGuard("categories:manage"))
	categories.Post("", h.Create)
	categories.Delete("/:id", h.Delete)
	categories.Post("/:id/subcategories", h.CreateSub)
	categories.Delete("/subcategories/:subID", h.DeleteSub)
}
