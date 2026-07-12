package updates

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary CreateController
// @Description CreateController for Updates
// @Tags Updates
// @Accept json
// @Produce json
// @Param body body updates.CreateUpdateRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[CourseUpdate]
// @Router /api/v1/updates [post]
func (m *UpdatesModule) CreateController(c *fiber.Ctx) error {
	var req CreateUpdateRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	u, err := m.CreateRepository(utils.GetUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to create update", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "update created", u, nil)
}

// @Summary UpdateController
// @Description UpdateController for Updates
// @Tags Updates
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Param body body updates.UpdateUpdateRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[CourseUpdate]
// @Router /api/v1/updates/{id} [patch]
func (m *UpdatesModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateUpdateRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	u, err := m.UpdateRepository(c.Params("id"), req.Message)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to modify update", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "update modified", u, nil)
}

// @Summary DeleteController
// @Description DeleteController for Updates
// @Tags Updates
// @Accept json
// @Produce json
// @Param id path string true "id"
// @Success 200 {object} utils.SwaggerResponse[utils.DeleteResponse]
// @Router /api/v1/updates/{id} [delete]
func (m *UpdatesModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete update", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "update deleted", map[string]string{"id": id}, nil)
}

// @Summary FeedController
// @Description FeedController for Updates
// @Tags Updates
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[UpdateFeedResponse]
// @Router /api/v1/updates/feed [get]
func (m *UpdatesModule) FeedController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	feed, err := m.FeedRepository(utils.GetUserID(c), page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch update feed", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "update feed fetched", feed, nil)
}

// @Summary ListController
// @Description ListController for Updates
// @Tags Updates
// @Accept json
// @Produce json
// @Success 200 {object} utils.PaginatedResponse[CourseUpdate]
// @Router /api/v1/updates [get]
func (m *UpdatesModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch updates", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "updates fetched", models.PaginatedResponse[[]CourseUpdate]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}
