package upload

import (
	"github.com/gofiber/fiber/v2"
)

func (m *UploadModule) Routes(v1, protected fiber.Router) {
	// A generic protected user can ask for this API to get a signed URL
	protected.Get("/upload/signed-url", m.GetSignedURLController)
}
