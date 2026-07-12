package certificate

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (c *CertificateModule) Routes(protected fiber.Router) {
	certificates := protected.Group("/certificates", middlewares.PermissionGuard("certificate:manage"))
	certificates.Get("", c.ListController)
	certificates.Post("/claim/course/:courseID", c.ClaimController)
}
