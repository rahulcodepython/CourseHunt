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
	courseID := c.Query("course_id")
	targetUserID := c.Query("user_id")

	perm, _ := c.Locals("permission").(string)
	scope := generic.ScopeFromPermission(perm)

	if scope == generic.ScopeTutor && courseID == "" {
		return utils.BadRequest(c, "Course ID required.", nil)
	}
	if scope != generic.ScopeTutor && courseID == "" && targetUserID == "" {
		return utils.BadRequest(c, "course_id or user_id is required.", nil)
	}

	page, limit := utils.PaginationParams(c)
	callerID := utils.GetUserID(c)

	list, total, err := ctrl.Repo.ListRepository(scope, page, limit, courseID, targetUserID, callerID,
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

func (ctrl *EnrollmentsController) RevokeController(c *fiber.Ctx) error {
	if err := ctrl.Repo.RevokeRepository(c.Params("userId"), c.Params("courseId")); err != nil {
		return utils.InternalError(c, "Failed to revoke course access.", err)
	}
	return utils.OK[any](c, "Course access revoked.", nil)
}

func (ctrl *EnrollmentsController) RegainController(c *fiber.Ctx) error {
	if err := ctrl.Repo.RegainRepository(c.Params("userId"), c.Params("courseId")); err != nil {
		return utils.InternalError(c, "Failed to regain course access.", err)
	}
	return utils.OK[any](c, "Course access regained.", nil)
}
