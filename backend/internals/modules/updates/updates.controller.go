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
	u, err := m.CreateRepository(utils.GetUserID(c), req)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to create update.", nil, nil)
	}
	return utils.JSON(c, http.StatusCreated, true, "Update created.", u, nil)
}

func (m *UpdatesModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateUpdateRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	u, err := m.UpdateRepository(c.Params("id"), req.Message)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to modify update.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Update modified.", u, nil)
}

func (m *UpdatesModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"))
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete update.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Update deleted.", map[string]string{"id": id}, nil)
}

func (m *UpdatesModule) FeedController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	feed, err := m.FeedRepository(utils.GetUserID(c), page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch update feed.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Update feed fetched.", feed, nil)
}

func (m *UpdatesModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch updates.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Updates fetched.", models.PaginatedResponse[[]CourseUpdate]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}
