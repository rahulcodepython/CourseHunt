package profile

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *ProfileModule) ReadUserProfileController(ctx *fiber.Ctx) error {
	p, err := m.ReadUserProfileService(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusNotFound, false, "profile not found", nil, nil)
	}
	return utils.JSON(ctx, http.StatusOK, true, "profile fetched", p, nil)
}

func (m *ProfileModule) ReadTutorProfileController(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if id == "" {
		id = utils.GetUserID(ctx)
	}
	p, err := m.ReadTutorProfileService(id)
	if err != nil {
		return utils.JSON(ctx, http.StatusNotFound, false, "tutor profile not found", nil, nil)
	}
	return utils.JSON(ctx, http.StatusOK, true, "tutor profile fetched", p, nil)
}

func (m *ProfileModule) UpsertUserProfileController(ctx *fiber.Ctx) error {
	var req UpdateProfileRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	p, err := m.UpsertUserProfileService(utils.GetUserID(ctx), req)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to save profile", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "profile saved", p, nil)
}

func (m *ProfileModule) UpsertTutorProfileController(ctx *fiber.Ctx) error {
	var req UpdateProfileRequest
	if ok, err := utils.Validate(ctx, &req); !ok {
		return err
	}
	p, err := m.UpsertTutorProfileService(utils.GetUserID(ctx), req)
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to save tutor profile", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "tutor profile saved", p, nil)
}
