package profile

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary ReadUserProfileController
// @Description ReadUserProfileController for Profile
// @Tags Profile
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[UserProfile]
// @Router /api/v1/profile/user [get]
func (m *ProfileModule) ReadUserProfileController(ctx *fiber.Ctx) error {
	p, err := m.ReadUserProfileRepository(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusNotFound, false, "profile not found", nil, nil)
	}
	return utils.JSON(ctx, http.StatusOK, true, "profile fetched", p, nil)
}

// @Summary ReadTutorProfileController
// @Description ReadTutorProfileController for Profile (own tutor profile)
// @Tags Profile
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[TutorProfile]
// @Router /api/v1/profile/tutor [get]
func (m *ProfileModule) ReadTutorProfileController(ctx *fiber.Ctx) error {
	userID := utils.GetUserID(ctx)
	p, err := m.ReadTutorProfileRepository(userID)
	if err != nil {
		return utils.JSON(ctx, http.StatusNotFound, false, "tutor profile not found", nil, nil)
	}
	return utils.JSON(ctx, http.StatusOK, true, "tutor profile fetched", p, nil)
}

// @Summary UpsertUserProfileController
// @Description UpsertUserProfileController for Profile
// @Tags Profile
// @Accept json
// @Produce json
// @Param body body profile.UpdateProfileRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[UserProfile]
// @Router /api/v1/profile/user [post]
func (m *ProfileModule) UpsertUserProfileController(ctx *fiber.Ctx) error {
	var req UpdateProfileRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	p, err := m.UpsertUserProfileRepository(utils.GetUserID(ctx), req)
	if err != nil {
		if errors.Is(err, ErrNotVerified) {
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: email is not verified", nil, nil)
		}
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to save profile", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "profile saved", p, nil)
}

// @Summary UpsertTutorProfileController
// @Description UpsertTutorProfileController for Profile
// @Tags Profile
// @Accept json
// @Produce json
// @Param body body profile.UpdateProfileRequest true "Request Body"
// @Success 200 {object} utils.SwaggerResponse[TutorProfile]
// @Router /api/v1/profile/tutor [post]
func (m *ProfileModule) UpsertTutorProfileController(ctx *fiber.Ctx) error {
	var req UpdateProfileRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	p, err := m.UpsertTutorProfileRepository(utils.GetUserID(ctx), req)
	if err != nil {
		if errors.Is(err, ErrNotVerified) {
			return utils.JSON(ctx, http.StatusForbidden, false, "access denied: email is not verified", nil, nil)
		}
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to save tutor profile", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "tutor profile saved", p, nil)
}

// @Summary AdminListProfilesController
// @Description AdminListProfilesController lists all student and tutor profiles (paginated)
// @Tags Profile
// @Accept json
// @Produce json
// @Success 200 {object} utils.PaginatedResponse[AdminProfileItem]
// @Router /api/v1/profile/admin [get]
func (m *ProfileModule) AdminListProfilesController(ctx *fiber.Ctx) error {
	page, limit := utils.PaginationParams(ctx)
	list, total, err := m.AdminListProfilesRepository(page, limit)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to list profiles", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "profiles listed", models.PaginatedResponse[[]AdminProfileItem]{
		Data: list, Total: total, Page: page, Limit: limit,
	}, nil)
}
