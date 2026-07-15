package users

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *UsersModule) ReadUserProfileController(c *fiber.Ctx) error {
	p, err := m.ReadUserProfileRepository(utils.GetUserID(c))
	if err != nil {
		return utils.JSON(c, http.StatusNotFound, false, "Profile not found.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Profile fetched.", p, nil)
}

func (m *UsersModule) ReadTutorProfileController(c *fiber.Ctx) error {
	userID := utils.GetUserID(c)
	p, err := m.ReadTutorProfileRepository(userID)
	if err != nil {
		return utils.JSON(c, http.StatusNotFound, false, "Tutor profile not found.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Tutor profile fetched.", p, nil)
}

func (m *UsersModule) UpsertUserProfileController(c *fiber.Ctx) error {
	var req UpdateProfileRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	p, err := m.UpsertUserProfileRepository(utils.GetUserID(c), req)
	if err != nil {
		if errors.Is(err, ErrNotVerified) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Email is not verified.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to save profile.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Profile saved.", p, nil)
}

func (m *UsersModule) UpsertTutorProfileController(c *fiber.Ctx) error {
	var req UpdateProfileRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}
	p, err := m.UpsertTutorProfileRepository(utils.GetUserID(c), req)
	if err != nil {
		if errors.Is(err, ErrNotVerified) {
			return utils.JSON(c, http.StatusForbidden, false, "Access denied. Email is not verified.", nil, err.Error())
		}
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to save tutor profile.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Tutor profile saved.", p, nil)
}

func (m *UsersModule) AdminListProfilesController(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := m.AdminListProfilesRepository(page, limit)
	if err != nil {
		return utils.JSON(c, http.StatusInternalServerError, false, "Failed to list profiles.", nil, nil)
	}
	return utils.JSON(c, http.StatusOK, true, "Profiles listed.", models.PaginatedResponse[[]AdminProfileItem]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}
