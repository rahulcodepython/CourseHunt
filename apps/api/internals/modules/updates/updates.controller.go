package updates

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *UpdatesModule) CreateController(c *fiber.Ctx) error {
	var req CreateUpdateRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	u, err := m.CreateRepository(utils.GetUserID(c), req)
	if err != nil {
		return utils.InternalError(c, "Failed to create update.", err)
	}
	return utils.Created(c, "Update created.", u)
}

func (m *UpdatesModule) UpdateController(c *fiber.Ctx) error {
	var req UpdateUpdateRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	u, err := m.UpdateRepository(c.Params("id"), req.Message)
	if err != nil {
		return utils.InternalError(c, "Failed to modify update.", err)
	}
	return utils.OK(c, "Update modified.", u)
}

func (m *UpdatesModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"))
	if err != nil {
		return utils.InternalError(c, "Failed to delete update.", err)
	}
	return utils.OK(c, "Update deleted.", generic.DeleteResponse{ID: id})
}

func (m *UpdatesModule) FeedController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	feed, err := m.FeedRepository(utils.GetUserID(c), page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch update feed.", err)
	}
	return utils.OK(c, "Update feed fetched.", feed)
}

func (m *UpdatesModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.ListRepository(page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch updates.", err)
	}
	return utils.OK(c, "Updates fetched.", generic.PaginatedResponse[[]CourseUpdate]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
