package certificates

import (
	"time"

	"coursehunt/server/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (a *App) RegisterRoutes(router fiber.Router, auth fiber.Handler) {
	router.Get("/v1/certificates/verify/:id", middlewares.TieredRouteRateLimiter(a.Cache.Client(), 60, 1*time.Minute, "cert_verify"), middlewares.ValidateUUIDParams("id"), a.handleVerify)

	g := router.Group("/v1/certificates", auth)
	g.Get("/", a.handleList)
	g.Post("/claim/course/:courseID", middlewares.ValidateUUIDParams("courseID"), a.handleClaim)
}
