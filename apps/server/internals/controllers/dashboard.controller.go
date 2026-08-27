package controllers

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type DashboardController struct {
	Repo *repositories.DashboardRepository
	Cfg  *config.Config
}

func NewDashboardController(repo *repositories.DashboardRepository, cfg *config.Config) *DashboardController {
	return &DashboardController{Repo: repo, Cfg: cfg}
}

func (ctrl *DashboardController) UserDashboardController(c *fiber.Ctx) error {
	d, err := ctrl.Repo.UserDashboardRepository(utils.GetUserID(c))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch user dashboard.", err)
	}
	return utils.OK(c, "User dashboard fetched.", d)
}

func (ctrl *DashboardController) TutorDashboardController(c *fiber.Ctx) error {
	d, err := ctrl.Repo.TutorDashboardRepository(utils.GetUserID(c))
	if err != nil {
		return utils.InternalError(c, "Failed to fetch tutor dashboard.", err)
	}
	return utils.OK(c, "Tutor dashboard fetched.", d)
}

func (ctrl *DashboardController) AdminDashboardController(c *fiber.Ctx) error {
	d, err := ctrl.Repo.AdminDashboardRepository()
	if err != nil {
		return utils.InternalError(c, "Failed to fetch admin dashboard.", err)
	}
	return utils.OK(c, "Admin dashboard fetched.", d)
}
