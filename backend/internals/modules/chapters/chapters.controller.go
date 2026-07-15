package chapters

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *ChaptersModule) ListController(c *fiber.Ctx) error {
	courseID := c.Query("course_id")
	chapters, err := m.ListRepository(courseID, utils.GetUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch chapters.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Chapters fetched successfully.", chapters, nil)
}

func (m *ChaptersModule) CreateController(c *fiber.Ctx) error {
	var req CreateChapterRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	ch, err := m.CreateRepository(utils.GetUserID(c), req.CourseID, req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to create chapter.", nil, nil)
	}
	return utils.JSON(c, http.StatusCreated, true, "Chapter created successfully.", ch, nil)
}

func (m *ChaptersModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateChapterRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	ch, err := m.UpdateRepository(c.Params("id"), utils.GetUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to update chapter.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Chapter updated successfully.", ch, nil)
}

func (m *ChaptersModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"), utils.GetUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete chapter.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Chapter deleted successfully.", models.DeleteResponse{ID: id}, nil)
}
