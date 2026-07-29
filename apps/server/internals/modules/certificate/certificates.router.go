package certificate

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *CertificateModule) Routes(v1, protected fiber.Router) {
	certificates := protected.Group("/certificates", middlewares.PermissionGuard(generic.UserCertificateManage))
	certificates.Get("", m.ListController)
	certificates.Post("/claim/course/:courseID", m.ClaimController)
}
