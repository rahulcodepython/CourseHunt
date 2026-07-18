package users

import (
	"errors"

	"coursehunt/api/internals/models"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *UsersModule) ReadUserProfileController(c *fiber.Ctx) error {
	p, err := m.ReadUserProfileRepository(utils.GetUserID(c))
	if err != nil {
		return utils.NotFound(c, "Profile not found.", err)
	}
	return utils.OK(c, "Profile fetched.", p)
}

func (m *UsersModule) ReadTutorProfileController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	p, err := m.ReadTutorProfileRepository(userID)
	if err != nil {
		return utils.NotFound(c, "Tutor profile not found.", err)
	}
	return utils.OK(c, "Tutor profile fetched.", p)
}

func (m *UsersModule) UpsertUserProfileController(c *fiber.Ctx) error {
	var req UpdateProfileRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	p, err := m.UpsertUserProfileRepository(utils.GetUserID(c), req)
	if err != nil {
		if errors.Is(err, ErrNotVerified) {
			return utils.Forbidden(c, "Access denied. Email is not verified.", err)
		}
		return utils.InternalError(c, "Failed to save profile.", err)
	}
	return utils.OK(c, "Profile saved.", p)
}

func (m *UsersModule) UpsertTutorProfileController(c *fiber.Ctx) error {
	var req UpdateProfileRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	p, err := m.UpsertTutorProfileRepository(utils.GetUserID(c), req)
	if err != nil {
		if errors.Is(err, ErrNotVerified) {
			return utils.Forbidden(c, "Access denied. Email is not verified.", err)
		}
		return utils.InternalError(c, "Failed to save tutor profile.", err)
	}
	return utils.OK(c, "Tutor profile saved.", p)
}

func (m *UsersModule) AdminListProfilesController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.AdminListProfilesRepository(page, limit)
	if err != nil {
		return utils.InternalError(c, "Failed to list profiles.", err)
	}
	return utils.OK(c, "Profiles listed.", models.PaginatedResponse[[]AdminProfileItem]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}
