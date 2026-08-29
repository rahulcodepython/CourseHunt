package certificates

import "github.com/gofiber/fiber/v2"

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	router.Get("/v1/certificates/verify/:id", a.handleVerify)

	g := router.Group("/v1/certificates", auth)
	g.Get("/", a.handleList)
	g.Post("/claim/course/:courseID", a.handleClaim)
}
