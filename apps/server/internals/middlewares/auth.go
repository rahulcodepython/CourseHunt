package middlewares

import (
	"errors"
	"fmt"
	"strings"

	"coursehunt/api/internals/config"
	"coursehunt/api/internals/generic"
	"coursehunt/api/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func isPublicPath(method, path string) bool {
	if path == "/health" || path == "/api/v1/health" || path == "/v1/health" {
		return true
	}
	if method == "POST" && (path == "/api/v1/auth/login" || path == "/api/v1/auth/google" || path == "/api/v1/auth/refresh" || path == "/api/v1/auth/logout") {
		return true
	}
	if method == "GET" {
		if path == "/api/v1/categories" || path == "/api/v1/courses" {
			return true
		}
		if strings.HasPrefix(path, "/api/v1/courses/") && !strings.HasPrefix(path, "/api/v1/courses/enrolled") && !strings.HasPrefix(path, "/api/v1/courses/manage") && !strings.HasSuffix(path, "/study") {
			return true
		}
	}
	return false
}

func BaseAuthMiddleware(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if isPublicPath(c.Method(), c.Path()) {
			return c.Next()
		}

		tokenString := c.Cookies(cfg.AuthCookieName)
		if tokenString == "" {
			return utils.Unauthorized(c, "Authorization token missing.", errors.New("token missing in cookies"))
		}

		token, err := jwt.ParseWithClaims(tokenString, &generic.UserClaims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(cfg.JWTSecret), nil
		})
		if err != nil || !token.Valid {
			return utils.Unauthorized(c, "Invalid or expired token.", err)
		}

		claims, ok := token.Claims.(*generic.UserClaims)
		if !ok {
			return utils.Unauthorized(c, "Invalid token claims.", nil)
		}

		if claims.Banned {
			return utils.Forbidden(c, "Account is banned.", nil)
		}

		permissionSet := make(map[string]struct{}, len(claims.Permissions))
		for _, p := range claims.Permissions {
			permissionSet[p] = struct{}{}
		}

		c.Locals("user", &generic.UserContext{
			UserID:      claims.Subject,
			Email:       claims.Email,
			Roles:       claims.Roles,
			Permissions: permissionSet,
		})
		return c.Next()
	}
}

func PermissionGuard(requiredPermissions ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, ok := c.Locals("user").(*generic.UserContext)
		if !ok || user == nil {
			return utils.Unauthorized(c, "Unauthorized.", errors.New("user context not found"))
		}

		for _, reqPerm := range requiredPermissions {
			if _, hasPerm := user.Permissions[reqPerm]; hasPerm {
				c.Locals("permission", reqPerm)
				return c.Next()
			}
		}

		return utils.Forbidden(c, "Permission denied.", nil)
	}
}
