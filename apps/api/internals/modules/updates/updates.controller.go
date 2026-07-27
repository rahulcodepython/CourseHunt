package updates

import (
	"fmt"
	"time"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type updatesListCacheData struct {
	Data  []CourseUpdate `json:"data"`
	Total int            `json:"total"`
}

func (m *UpdatesModule) CreateController(c *fiber.Ctx) error {
	var req CreateUpdateRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	u, err := m.CreateRepository(utils.GetUserID(c), req)
	if err != nil {
		return utils.InternalError(c, "Failed to create update.", err)
	}

	m.Cache.InvalidateUpdates(c.Context())

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

	m.Cache.InvalidateUpdates(c.Context())

	return utils.OK(c, "Update modified.", u)
}

func (m *UpdatesModule) DeleteController(c *fiber.Ctx) error {
	id, err := m.DeleteRepository(c.Params("id"))
	if err != nil {
		return utils.InternalError(c, "Failed to delete update.", err)
	}

	m.Cache.InvalidateUpdates(c.Context())

	return utils.OK(c, "Update deleted.", generic.DeleteResponse{ID: id})
}

func (m *UpdatesModule) FeedController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)
	cacheKey := fmt.Sprintf("updates:feed:u:%s:p:%d:l:%d", userID, page, limit)

	var cached []CourseUpdate
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Update feed fetched.", cached)
	}

	feed, err := m.FeedRepository(userID, page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch update feed.", err)
	}

	_ = m.Cache.Set(c.Context(), cacheKey, feed, 5*time.Minute)

	return utils.OK(c, "Update feed fetched.", feed)
}

func (m *UpdatesModule) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	cacheKey := fmt.Sprintf("updates:list:p:%d:l:%d", page, limit)

	var cached updatesListCacheData
	if hit, _ := m.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Updates fetched.", generic.PaginatedResponse[[]CourseUpdate]{
			Data: cached.Data, Total: cached.Total, Page: page, Limit: limit,
		})
	}

	list, total, err := m.ListRepository(page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch updates.", err)
	}

	_ = m.Cache.Set(c.Context(), cacheKey, updatesListCacheData{Data: list, Total: total}, 5*time.Minute)

	return utils.OK(c, "Updates fetched.", generic.PaginatedResponse[[]CourseUpdate]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
