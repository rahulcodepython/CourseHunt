package controllers

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/pkg/minio"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type UploadController struct {
	Cfg *config.Config
}

func NewUploadController(cfg *config.Config) *UploadController {
	return &UploadController{Cfg: cfg}
}

type SignedURLResponse struct {
	URL         string `json:"url"`
	DownloadURL string `json:"downloadUrl"`
	HTMLURL     string `json:"htmlUrl"`
}

func (ctrl *UploadController) GetSignedURLController(c *fiber.Ctx) error {
	fileName := c.Query("file_name")
	if fileName == "" {
		return utils.BadRequest(c, "File name query param required.", nil)
	}

	url, err := minio.MINIO.GetSignedURL(c.Context(), fileName)
	if err != nil {
		return utils.InternalError(c, "Failed to generate signed URL.", err)
	}

	publicURL := minio.MINIO.GetPublicURL(fileName)

	return utils.OK(c, "Signed URL generated successfully.", SignedURLResponse{
		URL:         url,
		DownloadURL: publicURL,
		HTMLURL:     publicURL,
	})
}
