package controllers

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type UsersController struct {
	Repo *repositories.UsersRepository
	Cfg  *config.Config
}

func NewUsersController(repo *repositories.UsersRepository, cfg *config.Config) *UsersController {
	return &UsersController{Repo: repo, Cfg: cfg}
}

func (ctrl *UsersController) AssignRoleController(c *fiber.Ctx) error {
	var req entities.AssignRoleRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	if err := ctrl.Repo.AssignRoleRepository(c.Params("id"), req.RoleIDs); err != nil {
		return utils.InternalError(c, "Failed to assign roles.", err)
	}
	return utils.OK(c, "Roles assigned.", entities.RoleAssignmentResponse{UserID: c.Params("id"), RoleIDs: req.RoleIDs})
}

func (ctrl *UsersController) DeleteRoleController(c *fiber.Ctx) error {
	var req entities.AssignRoleRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	if err := ctrl.Repo.DeleteRoleRepository(c.Params("id"), req.RoleIDs); err != nil {
		return utils.InternalError(c, "Failed to revoke roles.", err)
	}
	return utils.OK(c, "Roles revoked.", entities.RoleAssignmentResponse{UserID: c.Params("id"), RoleIDs: req.RoleIDs})
}

func (ctrl *UsersController) ListController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := ctrl.Repo.ListRepository(page, limit, c.Query("name"), c.Query("email"), c.Query("role"))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch users.", err)
	}
	return utils.OK(c, "Users fetched.", generic.PaginatedResponse[[]entities.UserListResponse]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
