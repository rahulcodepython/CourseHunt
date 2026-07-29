package controllers

import (
	"errors"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type DiscussionsController struct {
	Repo *repositories.DiscussionsRepository
	Cfg  *config.Config
}

func NewDiscussionsController(repo *repositories.DiscussionsRepository, cfg *config.Config) *DiscussionsController {
	return &DiscussionsController{Repo: repo, Cfg: cfg}
}

func (ctrl *DiscussionsController) ListController(c *fiber.Ctx) error {
	scope := resolveScope(c)
	page, limit := utils.PaginationParams(c)
	lessonID := c.Params("lessonId")
	userID := utils.GetUserID(c)

	list, total, err := ctrl.Repo.ListRepository(lessonID, "", userID, scope, page, limit)
	if err != nil {
		return errorForDiscussions(c, scope, err)
	}
	return utils.OK(c, "Discussions fetched.", generic.PaginatedResponse[[]entities.Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (ctrl *DiscussionsController) ListRepliesController(c *fiber.Ctx) error {
	scope := resolveScope(c)
	page, limit := utils.PaginationParams(c)
	parentID := c.Params("id")
	userID := utils.GetUserID(c)

	list, total, err := ctrl.Repo.ListRepository("", parentID, userID, scope, page, limit)
	if err != nil {
		return errorForDiscussions(c, scope, err)
	}
	return utils.OK(c, "Replies fetched.", generic.PaginatedResponse[[]entities.Discussion]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

func (ctrl *DiscussionsController) CreateController(c *fiber.Ctx) error {
	scope := resolveScope(c)
	var req entities.CreateDiscussionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	d, err := ctrl.Repo.CreateRepository(userID, req, scope)
	if err != nil {
		return errorForDiscussions(c, scope, err)
	}
	return utils.Created(c, "Discussion posted.", d)
}

func (ctrl *DiscussionsController) UpdateController(c *fiber.Ctx) error {
	scope := resolveScope(c)
	var req entities.UpdateDiscussionRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	userID := utils.GetUserID(c)
	d, err := ctrl.Repo.UpdateRepository(c.Params("id"), userID, req.Content, scope)
	if err != nil {
		return errorForDiscussions(c, scope, err)
	}
	return utils.OK(c, "Discussion updated.", d)
}

func (ctrl *DiscussionsController) DeleteController(c *fiber.Ctx) error {
	scope := resolveScope(c)
	userID := utils.GetUserID(c)
	id, err := ctrl.Repo.DeleteRepository(c.Params("id"), userID, scope)
	if err != nil {
		return errorForDiscussions(c, scope, err)
	}
	return utils.OK(c, "Discussion deleted.", generic.DeleteResponse{ID: id})
}

func errorForDiscussions(c *fiber.Ctx, _ generic.AuthScope, err error) error {
	switch {
	case errors.Is(err, generic.ErrDiscussionsTargetNotFound), errors.Is(err, generic.ErrDiscussionsLessonNotFound), errors.Is(err, generic.ErrDiscussionsDiscussionNotFound), errors.Is(err, generic.ErrDiscussionsParentNotFound):
		return utils.NotFound(c, "Resource not found.", err)
	case errors.Is(err, generic.ErrDiscussionsNotEnrolled), errors.Is(err, generic.ErrDiscussionsAccessDenied), errors.Is(err, generic.ErrDiscussionsParentInvalid):
		return utils.Forbidden(c, err.Error(), err)
	case errors.Is(err, generic.ErrDiscussionsMissingTarget):
		return utils.BadRequest(c, err.Error(), err)
	default:
		return utils.InternalError(c, "Operation failed.", err)
	}
}
