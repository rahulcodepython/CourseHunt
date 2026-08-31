package upload

import (
	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	g := router.Group("/v1/upload", auth)
	g.Get("/signed-url", a.handleGetSignedURL)
}
