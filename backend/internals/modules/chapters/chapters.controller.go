package chapters

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary ListController
// @Description ListController for Chapters
// @Tags Chapters
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Success 200 {object} utils.SwaggerResponse[[]Chapter]
// @Router /api/v1/chapters/course/{courseID} [get]
func (m *ChaptersModule) ListController(c *fiber.Ctx) error {
	chapters, err := m.ListService(c.Params("courseID"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch chapters", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "chapters fetched successfully", chapters, nil)
}

// @Summary CreateController
// @Description CreateController for Chapters
// @Tags Chapters
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Param body body chapters.CreateChapterRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[Chapter]
// @Router /api/v1/chapters/course/{courseID} [post]
func (m *ChaptersModule) CreateController(c *fiber.Ctx) error {
	var req CreateChapterRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	ch, err := m.CreateService(c.Params("courseID"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to create chapter", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "chapter created successfully", ch, nil)
}

// @Summary UpdateController
// @Description UpdateController for Chapters
// @Tags Chapters
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param body body chapters.UpdateChapterRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[Chapter]
// @Router /api/v1/chapters/{id} [patch]
func (m *ChaptersModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateChapterRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	ch, err := m.UpdateService(c.Params("id"), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to update chapter", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "chapter updated successfully", ch, nil)
}

// @Summary DeleteController
// @Description DeleteController for Chapters
// @Tags Chapters
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/chapters/{id} [delete]
func (m *ChaptersModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteService(c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete chapter", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "chapter deleted successfully", map[string]string{"id": id}, nil)
}
