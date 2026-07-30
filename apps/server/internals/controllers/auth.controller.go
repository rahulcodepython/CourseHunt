package controllers

import (
	"errors"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/helpers"
	"coursehunt/server/internals/services"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

type AuthController struct {
	Svc *services.AuthService
	Cfg *config.Config
}

func NewAuthController(svc *services.AuthService, cfg *config.Config) *AuthController {
	return &AuthController{Svc: svc, Cfg: cfg}
}

func (ctrl *AuthController) LoginWithEmailController(c *fiber.Ctx) error {
	var req entities.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "Invalid request body", err)
	}

	resp, refreshToken, err := ctrl.Svc.LoginWithEmailService(req)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrAuthUserBanned):
			return utils.Unauthorized(c, err.Error(), nil)
		case errors.Is(err, generic.ErrAuthInvalidCredentials):
			return utils.Unauthorized(c, err.Error(), nil)
		default:
			return utils.InternalError(c, "Login failed", err)
		}
	}

	helpers.SetCookies(ctrl.Cfg, c, resp.AccessToken, refreshToken)
	return utils.OK(c, "Login successful", resp)
}

func (ctrl *AuthController) LoginWithGoogleController(c *fiber.Ctx) error {
	var req entities.GoogleLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "Invalid request body", err)
	}

	resp, refreshToken, err := ctrl.Svc.LoginWithGoogleService(c.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrAuthNoEmailInToken):
			return utils.BadRequest(c, err.Error(), nil)
		case errors.Is(err, generic.ErrAuthUserNotFound):
			return utils.Unauthorized(c, err.Error(), nil)
		case errors.Is(err, generic.ErrAuthUserBanned):
			return utils.Unauthorized(c, err.Error(), nil)
		case errors.Is(err, generic.ErrAuthInvalidCredentials):
			return utils.Unauthorized(c, err.Error(), nil)
		default:
			return utils.InternalError(c, "Login failed", err)
		}
	}

	helpers.SetCookies(ctrl.Cfg, c, resp.AccessToken, refreshToken)
	return utils.OK(c, "Login successful", resp)
}

func (ctrl *AuthController) LogoutController(c *fiber.Ctx) error {
	refreshToken := c.Cookies(ctrl.Cfg.RefreshCookieName)
	if refreshToken != "" {
		_ = ctrl.Svc.LogoutService(refreshToken)
	}

	helpers.ClearCookies(ctrl.Cfg, c)
	return utils.OK[any](c, "Logged out successfully", nil)
}

func (ctrl *AuthController) CreateUserController(c *fiber.Ctx) error {
	var req entities.CreateUserRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}

	user, ok := c.Locals("user").(*generic.UserContext)
	if !ok {
		return utils.Unauthorized(c, "Unauthorized.", nil)
	}

	res, err := ctrl.Svc.CreateUserService(user.UserID, req)
	if err != nil {
		if errors.Is(err, generic.ErrAuthRoleNotFound) {
			return utils.BadRequest(c, err.Error(), nil)
		}
		return utils.InternalError(c, "Failed to create user.", err)
	}

	return utils.Created(c, "User created successfully.", res)
}

func (ctrl *AuthController) ChangePasswordController(c *fiber.Ctx) error {
	var req entities.ChangePasswordRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}

	user, ok := c.Locals("user").(*generic.UserContext)
	if !ok {
		return utils.Unauthorized(c, "Unauthorized.", nil)
	}

	resp, refreshToken, err := ctrl.Svc.ChangePasswordService(user.UserID, req)
	if err != nil {
		if errors.Is(err, generic.ErrAuthInvalidCurrentPassword) {
			return utils.BadRequest(c, err.Error(), nil)
		}
		return utils.InternalError(c, "Failed to change password.", err)
	}

	helpers.SetCookies(ctrl.Cfg, c, resp.AccessToken, refreshToken)
	return utils.OK(c, "Password changed.", resp)
}

func (ctrl *AuthController) GetMeController(c *fiber.Ctx) error {
	userCtx, _ := c.Locals("user").(*generic.UserContext)

	user, err := ctrl.Svc.Repo.GetUserByIDRepository(userCtx.UserID)
	if err != nil {
		return utils.InternalError(c, "Failed to fetch user details.", err)
	}

	return utils.OK(c, "User details retrieved successfully.", user)
}
