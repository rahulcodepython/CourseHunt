package v1

import (
	"fmt"
	"path/filepath"
	"time"

	"coursehunt-backend/internals/storage"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type StorageHandler struct {
	Storage *storage.MinioStorage
}

func NewStorageHandler() *StorageHandler {
	return &StorageHandler{Storage: storage.MINIO}
}

func (h *StorageHandler) UploadMedia(c *fiber.Ctx) error {
	if h.Storage == nil {
		return utils.InternalError(c, "File storage is not available")
	}

	file, err := c.FormFile("file")
	if err != nil {
		return utils.BadRequest(c, "Invalid file")
	}
	fileType := c.FormValue("fileType")
	if fileType == "" {
		return utils.BadRequest(c, "Invalid fileType")
	}

	src, err := file.Open()
	if err != nil {
		return utils.InternalError(c, "Failed to read file")
	}
	defer src.Close()

	objectName := fmt.Sprintf("%s/%s-%s", fileType, time.Now().Format("20060102150405"), uuid.NewString()+filepath.Ext(file.Filename))
	url, err := h.Storage.UploadFile(c.Context(), objectName, src, file.Size, file.Header.Get("Content-Type"))
	if err != nil {
		return utils.InternalError(c, "Failed to upload file")
	}
	return utils.Created(c, "File uploaded successfully", fiber.Map{"downloadUrl": url, "htmlUrl": url, "status": fiber.StatusCreated})
}

func (h *StorageHandler) ServeFile(c *fiber.Ctx) error {
	if h.Storage == nil {
		return utils.InternalError(c, "File storage is not available")
	}

	objectName := c.Params("*")
	obj, err := h.Storage.GetFile(c.Context(), objectName)
	if err != nil {
		return utils.BadRequest(c, "File not found")
	}
	defer obj.Close()
	return c.SendStream(obj)
}
