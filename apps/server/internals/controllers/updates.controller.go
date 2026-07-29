package controllers

import (
	"fmt"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type UpdatesController struct {
	Repo *repositories.UpdatesRepository
	Cfg  *config.Config
}

func NewUpdatesController(repo *repositories.UpdatesRepository, cfg *config.Config) *UpdatesController {
	return &UpdatesController{Repo: repo, Cfg: cfg}
}

type updatesListCacheData struct {
	Data  []entities.CourseUpdate `json:"data"`
	Total int                     `json:"total"`
}

func (ctrl *UpdatesController) CreateController(c *fiber.Ctx) error {
	var req entities.CreateUpdateRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	u, err := ctrl.Repo.CreateRepository(utils.GetUserID(c), req)
	if err != nil {
		return utils.InternalError(c, "Failed to create update.", err)
	}

	ctrl.Repo.Cache.InvalidateUpdates(c.Context())

	return utils.Created(c, "Update created.", u)
}

func (ctrl *UpdatesController) UpdateController(c *fiber.Ctx) error {
	var req entities.UpdateUpdateRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	u, err := ctrl.Repo.UpdateRepository(c.Params("id"), req.Message)
	if err != nil {
		return utils.InternalError(c, "Failed to modify update.", err)
	}

	ctrl.Repo.Cache.InvalidateUpdates(c.Context())

	return utils.OK(c, "Update modified.", u)
}

func (ctrl *UpdatesController) DeleteController(c *fiber.Ctx) error {
	id, err := ctrl.Repo.DeleteRepository(c.Params("id"))
	if err != nil {
		return utils.InternalError(c, "Failed to delete update.", err)
	}

	ctrl.Repo.Cache.InvalidateUpdates(c.Context())

	return utils.OK(c, "Update deleted.", generic.DeleteResponse{ID: id})
}

func (ctrl *UpdatesController) FeedController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)
	cacheKey := fmt.Sprintf("updates:feed:u:%s:p:%d:l:%d", userID, page, limit)

	var cached []entities.CourseUpdate
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Update feed fetched.", cached)
	}

	feed, err := ctrl.Repo.FeedRepository(userID, page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch update feed.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, feed, 5*time.Minute)

	return utils.OK(c, "Update feed fetched.", feed)
}

func (ctrl *UpdatesController) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	cacheKey := fmt.Sprintf("updates:list:p:%d:l:%d", page, limit)

	var cached updatesListCacheData
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Updates fetched.", generic.PaginatedResponse[[]entities.CourseUpdate]{
			Data: cached.Data, Total: cached.Total, Page: page, Limit: limit,
		})
	}

	list, total, err := ctrl.Repo.ListRepository(page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch updates.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, updatesListCacheData{Data: list, Total: total}, 5*time.Minute)

	return utils.OK(c, "Updates fetched.", generic.PaginatedResponse[[]entities.CourseUpdate]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
