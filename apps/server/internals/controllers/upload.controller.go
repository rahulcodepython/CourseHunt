package controllers

import (
	"path/filepath"
	"strings"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/generic"
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

var allowedExtensions = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
	".mp4": true, ".webm": true, ".pdf": true, ".doc": true, ".docx": true,
}

func (ctrl *UploadController) GetSignedURLController(c *fiber.Ctx) error {
	fileName := c.Query("file_name")
	if fileName == "" {
		return utils.BadRequest(c, generic.ErrMsgInvalidFileName, nil)
	}

	cleanFileName := filepath.Base(filepath.Clean(fileName))
	if cleanFileName == "." || cleanFileName == "/" || cleanFileName != fileName {
		return utils.BadRequest(c, generic.ErrMsgUnsafeFileName, nil)
	}

	ext := strings.ToLower(filepath.Ext(cleanFileName))
	if !allowedExtensions[ext] {
		return utils.BadRequest(c, generic.ErrMsgExtensionNotAllowed, nil)
	}

	url, err := minio.MINIO.GetSignedURL(c.Context(), cleanFileName)
	if err != nil {
		return utils.InternalError(c, "Failed to generate signed URL.", err)
	}

	publicURL := minio.MINIO.GetPublicURL(cleanFileName)

	return utils.OK(c, generic.MsgSignedURLGenerated, SignedURLResponse{
		URL:         url,
		DownloadURL: publicURL,
		HTMLURL:     publicURL,
	})
}
