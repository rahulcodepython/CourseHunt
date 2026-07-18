package certificate

import (
	"coursehunt-backend/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *CertificateModule) Routes(v1, protected fiber.Router) {
	certificates := protected.Group("/certificates", middlewares.PermissionGuard("certificate:manage"))
	certificates.Get("", m.ListController)
	certificates.Post("/claim/course/:courseID", m.ClaimController)
}
