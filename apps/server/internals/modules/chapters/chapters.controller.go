package chapters

import (
	"fmt"
	"time"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *ChaptersModule) ListController(c *fiber.Ctx) error {
	scope := m.resolveScope(c)
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.BadRequest(c, "Course ID query param required.", nil)
	}

	userID := utils.GetUserID(c)
	cacheKey := fmt.Sprintf("chapters:list:course:%s:u:%s:s:%v", courseID, userID, scope)

	var cached []Chapter
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Chapters fetched successfully.", cached)
	}

	chapters, err := m.ListRepository(courseID, userID, scope)
	if err != nil {
		if err == ErrCourseNotFound {
			return utils.NotFound(c, "Course not found.", err)
		}
		if err == ErrUnauthorized {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to fetch chapters.", err)
	}

	_ = m.Cache.Set(c.Context(), cacheKey, chapters, 10*time.Minute)

	return utils.OK(c, "Chapters fetched successfully.", chapters)
}

func (m *ChaptersModule) CreateController(c *fiber.Ctx) error {
	var req CreateChapterRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	ch, err := m.CreateRepository(utils.GetUserID(c), req.CourseID, req)
	if err != nil {
		return utils.InternalError(c, "Failed to create chapter.", err)
	}

	m.Cache.InvalidateChapters(c.Context())

	return utils.Created(c, "Chapter created successfully.", ch)
}

func (m *ChaptersModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateChapterRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	ch, err := m.UpdateRepository(c.Params("id"), utils.GetUserID(c), req)
	if err != nil {
		return utils.InternalError(c, "Failed to update chapter.", err)
	}

	m.Cache.InvalidateChapters(c.Context())

	return utils.OK(c, "Chapter updated successfully.", ch)
}

func (m *ChaptersModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"), utils.GetUserID(c))
	if err != nil {
		return utils.InternalError(c, "Failed to delete chapter.", err)
	}

	m.Cache.InvalidateChapters(c.Context())

	return utils.OK(c, "Chapter deleted successfully.", generic.DeleteResponse{ID: id})
}
