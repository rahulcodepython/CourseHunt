package updates

import (
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *UpdatesModule) CreateController(c *fiber.Ctx) error {
	var req CreateUpdateRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	u, err := m.CreateService(utils.GetUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to create update", nil, err.Error())
	}
	return utils.JSON(c, http.StatusCreated, true, "update created", u, nil)
}

func (m *UpdatesModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateUpdateRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	u, err := m.UpdateService(c.Params("id"), req.Message)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to modify update", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "update modified", u, nil)
}

func (m *UpdatesModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteService(c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to delete update", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "update deleted", map[string]string{"id": id}, nil)
}

func (m *UpdatesModule) FeedController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	feed, err := m.FeedService(utils.GetUserID(c), page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch update feed", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "update feed fetched", feed, nil)
}

func (m *UpdatesModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListService(page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "failed to fetch updates", nil, err.Error())
	}
	return utils.JSON(c, http.StatusOK, true, "updates fetched", models.PaginatedResponse{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}
