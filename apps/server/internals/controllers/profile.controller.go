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

type ProfileController struct {
	Repo *repositories.UsersRepository
	Cfg  *config.Config
}

func NewProfileController(repo *repositories.UsersRepository, cfg *config.Config) *ProfileController {
	return &ProfileController{Repo: repo, Cfg: cfg}
}

func (ctrl *ProfileController) ReadProfileController(c *fiber.Ctx) error {
	p, err := ctrl.Repo.ReadProfileRepository(utils.GetUserID(c))
	if err != nil {
		return utils.NotFound(c, "Profile not found.", err)
	}
	return utils.OK(c, "Profile fetched.", p)
}

func (ctrl *ProfileController) ReadUserProfileController(c *fiber.Ctx) error {
	return ctrl.ReadProfileController(c)
}

func (ctrl *ProfileController) ReadTutorProfileController(c *fiber.Ctx) error {
	return ctrl.ReadProfileController(c)
}

func (ctrl *ProfileController) UpsertProfileController(c *fiber.Ctx) error {
	var req entities.UpdateProfileRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	p, err := ctrl.Repo.UpsertProfileRepository(utils.GetUserID(c), req)
	if err != nil {
		if errors.Is(err, generic.ErrUsersNotVerified) {
			return utils.Forbidden(c, "Access denied. Email is not verified.", err)
		}
		return utils.InternalError(c, "Failed to save profile.", err)
	}
	return utils.OK(c, "Profile saved.", p)
}

func (ctrl *ProfileController) UpsertUserProfileController(c *fiber.Ctx) error {
	return ctrl.UpsertProfileController(c)
}

func (ctrl *ProfileController) UpsertTutorProfileController(c *fiber.Ctx) error {
	return ctrl.UpsertProfileController(c)
}

func (ctrl *ProfileController) AdminListProfilesController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := ctrl.Repo.AdminListProfilesRepository(page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to list profiles.", err)
	}
	return utils.OK(c, "Profiles listed.", generic.PaginatedResponse[[]entities.AdminProfileItem]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
