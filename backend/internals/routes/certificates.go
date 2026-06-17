package routes

import (
	"coursehunt-backend/internals/handlers"
	"github.com/gofiber/fiber/v2"
)

func SetupCertificatesRoutes(protected fiber.Router, h *handlers.CertificateHandler) {
	certificates := protected.Group("/certificates")
	certificates.Get("", h.List)
	certificates.Post("/claim/course/:courseID", h.Claim)
}
