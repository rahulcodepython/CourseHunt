package notifications

import "github.com/gofiber/fiber/v2"

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	g := router.Group("/v1/notifications", auth)
	g.Get("/", a.handleList)
}
