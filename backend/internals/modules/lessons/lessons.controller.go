package lessons

import (
	"net/http"

	"coursehunt-backend/internals/pkg/minio"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *LessonsModule) ListController(c *fiber.Ctx) error {
	lessons, err := m.ListService(c.Params("chapterID"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch lessons", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "lessons fetched successfully", lessons, nil)
}

func (m *LessonsModule) CreateController(c *fiber.Ctx) error {
	var req CreateLessonRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	l, err := m.CreateService(c.Params("chapterID"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to create lesson", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "lesson created successfully", l, nil)
}

func (m *LessonsModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateLessonRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	l, err := m.UpdateService(c.Params("id"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to update lesson", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "lesson updated successfully", l, nil)
}

func (m *LessonsModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteService(c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete lesson", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "lesson deleted successfully", map[string]string{"id": id}, nil)
}

func (m *LessonsModule) UpsertVideoContentController(c *fiber.Ctx) error {
	var req UpsertVideoContentRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	vc, err := m.UpsertVideoContentService(c.Params("id"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to update video content", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "video content updated successfully", vc, nil)
}

func (m *LessonsModule) UpsertDocumentContentController(c *fiber.Ctx) error {
	var req UpsertDocumentContentRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	dc, err := m.UpsertDocumentContentService(c.Params("id"), req.Content)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to update document content", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "document content updated successfully", dc, nil)
}

func (m *LessonsModule) ReadContentController(c *fiber.Ctx) error {
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "course_id query param required", nil, nil)
	}
	resp, err := m.ReadContentService(c.Params("id"), utils.GetUserID(c), courseID)
	if err != nil {
		if err.Error() == "not enrolled" {
			return utils.JSON(c, http.StatusForbidden, false, "not enrolled in this course", nil, nil)
		}
		if err.Error() == "lesson not found" {
			return utils.JSON(c, http.StatusNotFound, false, "lesson not found", nil, nil)
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch lesson content", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "lesson content fetched successfully", resp, nil)
}

func (m *LessonsModule) UpdateCompleteController(c *fiber.Ctx) error {
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "course_id query param required", nil, nil)
	}
	if err := m.UpdateCompleteService(utils.GetUserID(c), c.Params("id"), courseID); err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to mark lesson complete", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "lesson marked as complete", map[string]interface{}{"lesson_id": c.Params("id"), "completed": true}, nil)
}

func (m *LessonsModule) CreateResourceController(c *fiber.Ctx) error {
	var req AddResourceRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	res, err := m.CreateResourceService(c.Params("id"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to add resource", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "resource added successfully", res, nil)
}

func (m *LessonsModule) DeleteResourceController(c *fiber.Ctx) error {
	id, err := m.DeleteResourceService(c.Params("resourceID"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete resource", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "resource deleted successfully", map[string]string{"id": id}, nil)
}

func (m *LessonsModule) GetSignedURLController(c *fiber.Ctx) error {
	fileName := c.Query("file_name")
	if fileName == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "file_name query param required", nil, nil)
	}

	url, err := minio.MINIO.GetSignedURL(c.Context(), fileName)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to generate signed URL", nil, err.Error())
	}

	return utils.JSON(c, http.StatusOK, true, "signed URL generated successfully", map[string]string{"url": url}, nil)
}
