package controllers

import (
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type ChaptersController struct {
	Repo *repositories.ChaptersRepository
	Cfg  *config.Config
}

func NewChaptersController(repo *repositories.ChaptersRepository, cfg *config.Config) *ChaptersController {
	return &ChaptersController{Repo: repo, Cfg: cfg}
}

func (ctrl *ChaptersController) ListController(c *fiber.Ctx) error {
	scope := resolveScope(c)
	courseID := c.Query("course_id")
	if courseID == "" {
		return utils.BadRequest(c, "Course ID query param required.", nil)
	}

	userID := utils.GetUserID(c)
	cacheKey := fmt.Sprintf("chapters:list:course:%s:u:%s:s:%v", courseID, userID, scope)

	var cached []entities.Chapter
	if hit, _ := ctrl.Repo.Cache.Get(c.Context(), cacheKey, &cached); hit {
		return utils.OK(c, "Chapters fetched successfully.", cached)
	}

	chapters, err := ctrl.Repo.ListRepository(courseID, userID, scope)
	if err != nil {
		if errors.Is(err, generic.ErrChaptersCourseNotFound) {
			return utils.NotFound(c, "Course not found.", err)
		}
		if errors.Is(err, generic.ErrChaptersUnauthorized) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to fetch chapters.", err)
	}

	_ = ctrl.Repo.Cache.Set(c.Context(), cacheKey, chapters, 10*time.Minute)

	return utils.OK(c, "Chapters fetched successfully.", chapters)
}

func (ctrl *ChaptersController) CreateController(c *fiber.Ctx) error {
	var req entities.CreateChapterRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	ch, err := ctrl.Repo.CreateRepository(utils.GetUserID(c), req.CourseID, req)
	if err != nil {
		return utils.InternalError(c, "Failed to create chapter.", err)
	}

	ctrl.Repo.Cache.InvalidateChapters(c.Context())

	return utils.Created(c, "Chapter created successfully.", ch)
}

func (ctrl *ChaptersController) UpdateController(c *fiber.Ctx) error {
	var req entities.UpdateChapterRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	ch, err := ctrl.Repo.UpdateRepository(c.Params("id"), utils.GetUserID(c), req)
	if err != nil {
		return utils.InternalError(c, "Failed to update chapter.", err)
	}

	ctrl.Repo.Cache.InvalidateChapters(c.Context())

	return utils.OK(c, "Chapter updated successfully.", ch)
}

func (ctrl *ChaptersController) DeleteController(c *fiber.Ctx) error {
	id, err := ctrl.Repo.DeleteRepository(c.Params("id"), utils.GetUserID(c))
	if err != nil {
		return utils.InternalError(c, "Failed to delete chapter.", err)
	}

	ctrl.Repo.Cache.InvalidateChapters(c.Context())

	return utils.OK(c, "Chapter deleted successfully.", generic.DeleteResponse{ID: id})
}
