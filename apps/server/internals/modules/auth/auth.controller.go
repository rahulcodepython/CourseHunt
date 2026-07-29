package auth

import (
	"errors"

	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (m *AuthModule) LoginWithEmailController(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "Invalid request body", err)
	}

	resp, refreshToken, err := m.LoginWithEmailService(req)
	if err != nil {
		switch {
		case errors.Is(err, ErrUserBanned):
			return utils.Unauthorized(c, err.Error(), nil)
		case errors.Is(err, ErrInvalidCredentials):
			return utils.Unauthorized(c, err.Error(), nil)
		default:
			return utils.InternalError(c, "Login failed", err)
		}
	}

	m.setCookies(c, resp.AccessToken, refreshToken)
	return utils.OK(c, "Login successful", resp)
}

func (m *AuthModule) LoginWithGoogleController(c *fiber.Ctx) error {
	var req GoogleLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "Invalid request body", err)
	}

	resp, refreshToken, err := m.LoginWithGoogleService(c.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNoEmailInToken):
			return utils.BadRequest(c, err.Error(), nil)
		case errors.Is(err, ErrUserNotFound):
			return utils.Unauthorized(c, err.Error(), nil)
		case errors.Is(err, ErrUserBanned):
			return utils.Unauthorized(c, err.Error(), nil)
		case errors.Is(err, ErrInvalidCredentials):
			return utils.Unauthorized(c, err.Error(), nil)
		default:
			return utils.InternalError(c, "Login failed", err)
		}
	}

	m.setCookies(c, resp.AccessToken, refreshToken)
	return utils.OK(c, "Login successful", resp)
}

func (m *AuthModule) RefreshTokenController(c *fiber.Ctx) error {
	refreshToken := c.Cookies(m.Cfg.RefreshCookieName)
	if refreshToken == "" {
		return utils.Unauthorized(c, "No refresh token provided", nil)
	}

	resp, newRefreshToken, err := m.RefreshTokenService(refreshToken)
	if err != nil {
		m.clearCookies(c)
		switch {
		case errors.Is(err, ErrSessionExpired), errors.Is(err, ErrUserBanned):
			return utils.Unauthorized(c, err.Error(), nil)
		default:
			return utils.InternalError(c, "Failed to refresh token", err)
		}
	}

	m.setCookies(c, resp.AccessToken, newRefreshToken)
	return utils.OK(c, "Token refreshed", resp)
}

func (m *AuthModule) LogoutController(c *fiber.Ctx) error {
	refreshToken := c.Cookies(m.Cfg.RefreshCookieName)
	if refreshToken != "" {
		_ = m.LogoutService(refreshToken)
	}

	m.clearCookies(c)
	return utils.OK[any](c, "Logged out successfully", nil)
}

func (m *AuthModule) CreateUserController(c *fiber.Ctx) error {
	var req CreateUserRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}

	user, ok := c.Locals("user").(generic.UserContext)
	if !ok {
		return utils.Unauthorized(c, "Unauthorized.", nil)
	}

	res, err := m.CreateUserService(user.UserID, req)
	if err != nil {
		if errors.Is(err, ErrRoleNotFound) {
			return utils.BadRequest(c, err.Error(), nil)
		}
		return utils.InternalError(c, "Failed to create user.", err)
	}

	return utils.Created(c, "User created successfully.", res)
}

func (m *AuthModule) ChangePasswordController(c *fiber.Ctx) error {
	var req ChangePasswordRequest
	if ok, err := utils.Validate(c, &req); !ok {
		return err
	}

	user, ok := c.Locals("user").(generic.UserContext)
	if !ok {
		return utils.Unauthorized(c, "Unauthorized.", nil)
	}

	resp, refreshToken, err := m.ChangePasswordService(user.UserID, req)
	if err != nil {
		if errors.Is(err, ErrInvalidCurrentPassword) {
			return utils.BadRequest(c, err.Error(), nil)
		}
		return utils.InternalError(c, "Failed to change password.", err)
	}

	m.setCookies(c, resp.AccessToken, refreshToken)
	return utils.OK(c, "Password changed.", resp)
}
