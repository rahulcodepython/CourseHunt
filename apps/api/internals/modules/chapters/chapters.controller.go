package chapters

import (
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

	chapters, err := m.ListRepository(courseID, utils.GetUserID(c), scope)
	if err != nil {
		if err == ErrCourseNotFound {
			return utils.NotFound(c, "Course not found.", err)
		}
		if err == ErrUnauthorized {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to fetch chapters.", err)
	}
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
	return utils.OK(c, "Chapter updated successfully.", ch)
}

func (m *ChaptersModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"), utils.GetUserID(c))
	if err != nil {
		return utils.InternalError(c, "Failed to delete chapter.", err)
	}
	return utils.OK(c, "Chapter deleted successfully.", generic.DeleteResponse{ID: id})
}
