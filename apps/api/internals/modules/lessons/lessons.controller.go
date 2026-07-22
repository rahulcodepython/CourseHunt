package lessons

import (
	"errors"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *LessonsModule) ListController(c *fiber.Ctx) error {
	scope := m.resolveScope(c)
	chapterID := c.Query("chapter_id")
	if chapterID == "" {
		return utils.BadRequest(c, "Chapter ID query param required.", nil)
	}
	userID := utils.GetUserID(c)
	lessons, err := m.ListRepository(chapterID, userID, scope)
	if err != nil {
		if errors.Is(err, ErrChapterNotFound) {
			return utils.NotFound(c, "Chapter not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to fetch lessons.", err)
	}
	return utils.OK(c, "Lessons fetched successfully.", lessons)
}

func (m *LessonsModule) CreateController(c *fiber.Ctx) error {
	var req CreateLessonRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	chapterID := c.Query("chapter_id")
	if chapterID == "" {
		return utils.BadRequest(c, "Chapter ID query param required.", nil)
	}
	l, err := m.CreateRepository(userID, chapterID, req)
	if err != nil {
		if errors.Is(err, ErrChapterNotFound) {
			return utils.NotFound(c, "Chapter not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to create lesson.", err)
	}
	return utils.Created(c, "Lesson created successfully.", l)
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
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to update lesson.", err)
	}
	return utils.OK(c, "Lesson updated successfully.", l)
}

func (m *LessonsModule) DeleteController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteRepository(c.Params("id"), userID)
	if err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to delete lesson.", err)
	}
	return utils.OK(c, "Lesson deleted successfully.", generic.DeleteResponse{ID: id})
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
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to update video content.", err)
	}
	return utils.OK(c, "Video content updated successfully.", vc)
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
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to update document content.", err)
	}
	return utils.OK(c, "Document content updated successfully.", dc)
}

func (m *LessonsModule) ReadContentController(c *fiber.Ctx) error {
	scope := m.resolveScope(c)
	resp, err := m.ReadContentRepository(c.Params("id"), utils.GetUserID(c), scope)
	if err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		return utils.InternalError(c, "Failed to fetch lesson content.", err)
	}
	return utils.OK(c, "Lesson content fetched successfully.", resp)
}

func (m *LessonsModule) UpdateCompleteController(c *fiber.Ctx) error {
	if err := m.MarkLessonCompleteRepository(utils.GetUserID(c), c.Params("id")); err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		return utils.InternalError(c, "Failed to mark lesson complete.", err)
	}
	return utils.OK(c, "Lesson marked as complete.", LessonCompleteResponse{LessonID: c.Params("id"), Completed: true})
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
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to add resource.", err)
	}
	return utils.Created(c, "Resource added successfully.", res)
}

func (m *LessonsModule) DeleteResourceController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	id, err := m.DeleteResourceRepository(c.Params("resourceID"), userID)
	if err != nil {
		if errors.Is(err, ErrResourceNotFound) {
			return utils.NotFound(c, "Resource not found.", err)
		}
		if errors.Is(err, ErrAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to delete resource.", err)
	}
	return utils.OK(c, "Resource deleted successfully.", generic.DeleteResponse{ID: id})
}

func (m *LessonsModule) ReadResourcesController(c *fiber.Ctx) error {
	scope := m.resolveScope(c)
	userID := utils.GetUserID(c)
	resources, err := m.ReadResourcesRepository(c.Params("id"), userID, scope)
	if err != nil {
		if errors.Is(err, ErrLessonNotFound) {
			return utils.NotFound(c, "Lesson not found.", err)
		}
		if errors.Is(err, ErrNotEnrolled) {
			return utils.Forbidden(c, "Access denied. Not enrolled in course.", err)
		}
		return utils.InternalError(c, "Failed to fetch resources.", err)
	}
	return utils.OK(c, "Resources fetched successfully.", resources)
}
