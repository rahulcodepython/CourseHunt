package discussions

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *DiscussionsModule) ListController(c *fiber.Ctx) error {
	scope := m.resolveScope(c)
	page, limit := utils.PaginationParams(c)
	lessonID := c.Params("lessonId")
	userID := utils.GetUserID(c)

	list, total, err := m.ListRepository(lessonID, "", userID, scope, page, limit)
	if err != nil {
		return errorForScope(c, scope, err)
	}
	return utils.OK(c, "Discussions fetched.", generic.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *DiscussionsModule) ListRepliesController(c *fiber.Ctx) error {
	scope := m.resolveScope(c)
	page, limit := utils.PaginationParams(c)
	parentID := c.Params("id")
	userID := utils.GetUserID(c)

	list, total, err := m.ListRepository("", parentID, userID, scope, page, limit)
	if err != nil {
		return errorForScope(c, scope, err)
	}
	return utils.OK(c, "Replies fetched.", generic.PaginatedResponse[[]Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (m *DiscussionsModule) CreateController(c *fiber.Ctx) error {
	scope := m.resolveScope(c)
	var req CreateDiscussionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	d, err := m.CreateRepository(userID, req, scope)
	if err != nil {
		return errorForScope(c, scope, err)
	}
	return utils.Created(c, "Discussion posted.", d)
}

func (m *DiscussionsModule) UpdateController(c *fiber.Ctx) error {
	scope := m.resolveScope(c)
	var req UpdateDiscussionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	d, err := m.UpdateRepository(c.Params("id"), userID, req.Content, scope)
	if err != nil {
		return errorForScope(c, scope, err)
	}
	return utils.OK(c, "Discussion updated.", d)
}

func (m *DiscussionsModule) DeleteController(c *fiber.Ctx) error {
	scope := m.resolveScope(c)
	userID := utils.GetUserID(c)
	id, err := m.DeleteRepository(c.Params("id"), userID, scope)
	if err != nil {
		return errorForScope(c, scope, err)
	}
	return utils.OK(c, "Discussion deleted.", generic.DeleteResponse{ID: id})
}
