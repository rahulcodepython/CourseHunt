package lessons

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/pkg/minio"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *LessonsModule) ListController(c *fiber.Ctx) error {
	chapterID := c.Query("chapter_id")
	if chapterID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "Chapter ID query param required.", nil, nil)
	}
	userID := utils.GetUserID(c)
	lessons, err := m.ListRepository(chapterID, userID)
	if err != nil {
		if errors.Is(err, ErrChapterNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Chapter not found.", nil, err.Error())
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch lessons.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Lessons fetched successfully.", lessons, nil)
}

func (m *LessonsModule) CreateController(c *fiber.Ctx) error {
	var req CreateLessonRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	chapterID := c.Query("chapter_id")
	if chapterID == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "Chapter ID query param required.", nil, nil)
	}
	l, err := m.CreateRepository(userID, chapterID, req)
	if err != nil {
		if errors.Is(err, ErrChapterNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Chapter not found.", nil, err.Error())
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to create lesson.", nil, nil)
	}
	return utils.JSON(c, http.StatusCreated, true, "Lesson created successfully.", l, nil)
}

func (m *LessonsModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateLessonRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	l, err := m.UpdateRepository(c.Params("id"), userID, req)
	if err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Lesson not found.", nil, err.Error())
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to update lesson.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Lesson updated successfully.", l, nil)
}

func (m *LessonsModule) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteRepository(c.Params("id"), userID)
	if err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Lesson not found.", nil, err.Error())
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete lesson.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Lesson deleted successfully.", models.DeleteResponse{ID: id}, nil)
}

func (m *LessonsModule) UpsertVideoContentController(c *fiber.Ctx) error {
	var req UpsertVideoContentRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	vc, err := m.UpsertVideoContentRepository(c.Params("id"), userID, req)
	if err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Lesson not found.", nil, err.Error())
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to update video content.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Video content updated successfully.", vc, nil)
}

func (m *LessonsModule) UpsertDocumentContentController(c *fiber.Ctx) error {
	var req UpsertDocumentContentRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	dc, err := m.UpsertDocumentContentRepository(c.Params("id"), userID, req.Content)
	if err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Lesson not found.", nil, err.Error())
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to update document content.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Document content updated successfully.", dc, nil)
}

func (m *LessonsModule) ReadContentController(c *fiber.Ctx) error {
	resp, err := m.ReadContentAggregatedRepository(c.Params("id"), utils.GetUserID(c))
	if err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Lesson not found.", nil, err.Error())
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch lesson content.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Lesson content fetched successfully.", resp, nil)
}

func (m *LessonsModule) UpdateCompleteController(c *fiber.Ctx) error {
	if err := m.MarkLessonComplete(utils.GetUserID(c), c.Params("id")); err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Lesson not found.", nil, err.Error())
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Not enrolled in course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to mark lesson complete.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Lesson marked as complete.", LessonCompleteResponse{LessonID: c.Params("id"), Completed: true}, nil)
}

func (m *LessonsModule) CreateResourceController(c *fiber.Ctx) error {
	var req AddResourceRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	res, err := m.CreateResourceRepository(c.Params("id"), userID, req)
	if err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Lesson not found.", nil, err.Error())
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to add resource.", nil, nil)
	}
	return utils.JSON(c, http.StatusCreated, true, "Resource added successfully.", res, nil)
}

func (m *LessonsModule) DeleteResourceController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteResourceRepository(c.Params("resourceID"), userID)
	if err != nil {
		if errors.Is(err, ErrResourceNotFound) {
			return utils.JSON(c, http.StatusNotFound, false, "Resource not found.", nil, err.Error())
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. You do not own this course.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete resource.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Resource deleted successfully.", models.DeleteResponse{ID: id}, nil)
}

func (m *LessonsModule) GetSignedURLController(c *fiber.Ctx) error {
	fileName := c.Query("file_name")
	if fileName == "" {
		return utils.JSON(c, http.StatusBadRequest, false, "File name query param required.", nil, nil)
	}

	url, err := minio.MINIO.GetSignedURL(c.Context(), fileName)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to generate signed URL.", nil, nil)
	}

	return utils.JSON(c, http.StatusOK, true, "Signed URL generated successfully.", SignedURLResponse{URL: url}, nil)
}
