package auth

import (
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/middlewares"

	"github.com/gofiber/fiber/v2"
)

func (m *AuthModule) Routes(v1, protected fiber.Router) {
	authGroup := v1.Group("/auth")
	authGroup.Post("/login", m.LoginWithEmailController)
	authGroup.Post("/google", m.LoginWithGoogleController)
	authGroup.Post("/refresh", m.RefreshTokenController)
	authGroup.Post("/logout", m.LogoutController)

	protectedAuth := protected.Group("/auth")
	protectedAuth.Post("/user", middlewares.PermissionGuard(generic.AdminUsersCreate), m.CreateUserController)
	protectedAuth.Post("/change-password", m.ChangePasswordController)
}
