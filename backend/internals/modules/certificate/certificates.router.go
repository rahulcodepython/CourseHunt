package certificate

import (
	"github.com/gofiber/fiber/v2"
)

func (c *CertificateModule) Routes(protected fiber.Router) {
	certificates := protected.Group("/certificates")
	certificates.Get("", c.ListController)
	certificates.Post("/claim/course/:courseID", c.ClaimController)
}
