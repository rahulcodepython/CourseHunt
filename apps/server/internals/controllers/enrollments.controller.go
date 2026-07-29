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

type EnrollmentsController struct {
	Repo *repositories.EnrollmentsRepository
	Cfg  *config.Config
}

func NewEnrollmentsController(repo *repositories.EnrollmentsRepository, cfg *config.Config) *EnrollmentsController {
	return &EnrollmentsController{Repo: repo, Cfg: cfg}
}

func (ctrl *EnrollmentsController) ListController(c *fiber.Ctx) error {
	courseID := c.Params("course_id")
	if courseID == "" {
		return utils.BadRequest(c, "Course ID required.", nil)
	}

	page, limit := utils.PaginationParams(c)
	userID := utils.GetUserID(c)
	perm, _ := c.Locals("permission").(string)
	scope := generic.ScopeFromPermission(perm)

	list, total, err := ctrl.Repo.ListRepository(scope, page, limit, courseID, userID, userID,
		c.Query("user_name"), c.Query("user_email"), c.Query("revoked"))
	if err != nil {
		if errors.Is(err, generic.ErrEnrollmentsAccessDenied) {
			return utils.Forbidden(c, "Access denied. You do not own this course.", err)
		}
		return utils.InternalError(c, "Failed to fetch enrollments.", err)
	}
	return utils.OK(c, "Enrollments fetched.", generic.PaginatedResponse[[]entities.ListEnrollmentResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
