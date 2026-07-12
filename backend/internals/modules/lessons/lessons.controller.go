package lessons

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/pkg/minio"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary ListController
// @Description ListController for Lessons
// @Tags Lessons
// @Accept json
// @Produce json
// @Param chapter_id query string true "chapter_id"
// @Success 200 {object} utils.SwaggerResponse[[]Lesson]
// @Router /api/v1/lessons [get]
func (m *LessonsModule) ListController(c *fiber.Ctx) error {
	chapterID := c.Query("chapter_id")
	if chapterID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "chapter_id query param required", nil, nil)
	}
	userID := utils.GetUserID(c)
	lessons, err := m.ListRepository(chapterID, userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrChapterNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "chapter not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch lessons", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "lessons fetched successfully", lessons, nil)
}

// @Summary CreateController
// @Description CreateController for Lessons
// @Tags Lessons
// @Accept json
// @Produce json
// @Param chapter_id query string true "chapter_id"
// @Param body body lessons.CreateLessonRequest true "Request Body"
// @Success 201 {object} utils.SwaggerResponse[Lesson]
// @Router /api/v1/lessons [post]
func (m *LessonsModule) CreateController(c *fiber.Ctx) error {
	var req CreateLessonRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	chapterID := c.Query("chapter_id")
	if chapterID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "chapter_id query param required", nil, nil)
	}
	l, err := m.CreateRepository(userID, chapterID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrChapterNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "chapter not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to create lesson", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusCreated, true, "lesson created successfully", l, nil)
}

// @Summary UpdateController
// @Description UpdateController for Lessons
// @Tags Lessons
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param body body lessons.UpdateLessonRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[Lesson]
// @Router /api/v1/lessons/{id} [patch]
func (m *LessonsModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateLessonRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	l, err := m.UpdateRepository(c.Params("id"), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "lesson not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to update lesson", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "lesson updated successfully", l, nil)
}

// @Summary DeleteController
// @Description DeleteController for Lessons
// @Tags Lessons
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/lessons/{id} [delete]
func (m *LessonsModule) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteRepository(c.Params("id"), userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "lesson not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete lesson", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "lesson deleted successfully", map[string]string{"id": id}, nil)
}

// @Summary UpsertVideoContentController
// @Description UpsertVideoContentController for Lessons
// @Tags Lessons
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param body body lessons.UpsertVideoContentRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[LessonVideoContent]
// @Router /api/v1/lessons/{id}/video [post]
func (m *LessonsModule) UpsertVideoContentController(c *fiber.Ctx) error {
	var req UpsertVideoContentRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	vc, err := m.UpsertVideoContentRepository(c.Params("id"), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "lesson not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to update video content", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "video content updated successfully", vc, nil)
}

// @Summary UpsertDocumentContentController
// @Description UpsertDocumentContentController for Lessons
// @Tags Lessons
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param body body lessons.UpsertDocumentContentRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[LessonDocumentContent]
// @Router /api/v1/lessons/{id}/document [post]
func (m *LessonsModule) UpsertDocumentContentController(c *fiber.Ctx) error {
	var req UpsertDocumentContentRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	dc, err := m.UpsertDocumentContentRepository(c.Params("id"), userID, req.Content)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "lesson not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to update document content", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "document content updated successfully", dc, nil)
}

// @Summary ReadContentController
// @Description ReadContentController for Lessons
// @Tags Lessons
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[AggregatedLessonContentResponse]
// @Router /api/v1/lessons/{id}/content [get]
func (m *LessonsModule) ReadContentController(c *fiber.Ctx) error {
	resp, err := m.ReadContentAggregatedRepository(c.Params("id"), utils.GetUserID(c))
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "lesson not found", nil, nil)
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: not enrolled in course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch lesson content", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "lesson content fetched successfully", resp, nil)
}

// @Summary UpdateCompleteController
// @Description UpdateCompleteController for Lessons
// @Tags Lessons
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[LessonCompleteResponse]
// @Router /api/v1/lessons/{id}/complete [post]
func (m *LessonsModule) UpdateCompleteController(c *fiber.Ctx) error {
	if err := m.MarkLessonComplete(utils.GetUserID(c), c.Params("id")); err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "lesson not found", nil, nil)
		case errors.Is(err, ErrNotEnrolled):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: not enrolled in course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to mark lesson complete", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "lesson marked as complete", map[string]interface{}{"lesson_id": c.Params("id"), "completed": true}, nil)
}

// @Summary CreateResourceController
// @Description CreateResourceController for Lessons
// @Tags Lessons
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param body body lessons.AddResourceRequest true "Request Body"
// @Success 201 {object} utils.SwaggerResponse[LessonResource]
// @Router /api/v1/lessons/{id}/resources [post]
func (m *LessonsModule) CreateResourceController(c *fiber.Ctx) error {
	var req AddResourceRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	res, err := m.CreateResourceRepository(c.Params("id"), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "lesson not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to add resource", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusCreated, true, "resource added successfully", res, nil)
}

// @Summary DeleteResourceController
// @Description DeleteResourceController for Lessons
// @Tags Lessons
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param resourceID path string true "resourceID"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/lessons/{id}/resources/{resourceID} [delete]
func (m *LessonsModule) DeleteResourceController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteResourceRepository(c.Params("resourceID"), userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrResourceNotFound):
			return utils.JSON(c, http.StatusNotFound, false, "resource not found", nil, nil)
		case errors.Is(err, ErrAccessDenied):
			return utils.JSON(c, http.StatusForbidden, false, "access denied: you do not own this course", nil, nil)
		default:
			return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete resource", nil, err.Error())
		}
	}
	return utils.JSON(c, http.StatusOK, true, "resource deleted successfully", map[string]string{"id": id}, nil)
}

// @Summary GetSignedURLController
// @Description GetSignedURLController for Lessons
// @Tags Lessons
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[SignedURLResponse]
// @Router /api/v1/lessons/{id}/signed-url [get]
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
