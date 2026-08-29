package middlewares

import (
	"context"
	"strings"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/pkg/jwt"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

var verifier *jwt.Verifier

// InitAuth wires the JWKS verifier used by BaseAuthMiddleware — called once at
// startup (see cmd/server/main.go) since it holds a background refresh
// goroutine for the keyset.
func InitAuth(v *jwt.Verifier) {
	verifier = v
}

// UsersLookup is the narrow callback BaseAuthMiddleware needs into the users
// feature — declared here instead of importing internals/features/users
// directly, since that package's routes.go imports this middlewares package
// (PermissionGuard), and middlewares importing it back would cycle.
type UsersLookup interface {
	GetRolesAndPermissions(ctx context.Context, userID string) (generic.RolesAndPermissionsResult, error)
}

// BaseAuthMiddleware verifies the bearer JWT issued by better-auth and populates
// the authenticated UserContext on the Fiber request context.
func BaseAuthMiddleware(cfg *config.Config, cch *cache.Cache, usersRepo UsersLookup) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		token, ok := strings.CutPrefix(authHeader, "Bearer ")
		if !ok || token == "" {
			return utils.ErrUnauthorized("Authorization token missing or session expired.", generic.ErrAuthTokenMissing)
		}

		if verifier == nil {
			return utils.ErrInternal("Auth verifier not initialized", nil)
		}

		claims, err := verifier.Parse(token)
		if err != nil {
			return utils.ErrUnauthorized("Authorization token missing or session expired.", err)
		}

		if claims.Banned {
			return utils.ErrUnauthorized("Authorization token missing or session expired.", generic.ErrAuthUserBanned)
		}

		if claims.MustChangePassword {
			return utils.ErrUnauthorized("Password change required before API access.", generic.ErrAuthMustChangePassword)
		}

		role := claims.Role
		roles := claims.Roles
		var permissions []string
		banned := claims.Banned

		if usersRepo != nil && claims.Subject != "" {
			if fresh, err := usersRepo.GetRolesAndPermissions(c.Context(), claims.Subject); err == nil {
				role = fresh.Role
				roles = fresh.Roles
				permissions = fresh.Permissions
				banned = fresh.Banned
			}
		}

		if banned {
			return utils.ErrUnauthorized("Authorization token missing or session expired.", generic.ErrAuthUserBanned)
		}

		perms := make(map[string]struct{}, len(permissions))
		for _, p := range permissions {
			perms[p] = struct{}{}
		}

		c.Locals("user", &generic.UserContext{
			UserID:      claims.Subject,
			Role:        role,
			Roles:       roles,
			Permissions: perms,
		})

		return c.Next()
	}
}

// UserFromContext reads the UserContext stored in Fiber locals.
func UserFromContext(c *fiber.Ctx) (*generic.UserContext, error) {
	user, ok := c.Locals("user").(*generic.UserContext)
	if !ok || user == nil {
		return nil, generic.ErrAuthNoUserContext
	}
	return user, nil
}

// UserID returns the authenticated user's ID string, or "" if unauthenticated.
func UserID(c *fiber.Ctx) string {
	if user, err := UserFromContext(c); err == nil && user != nil {
		return user.UserID
	}
	return ""
}

// PermissionGuard restricts a route to callers holding at least one of the
// required permissions.
func PermissionGuard(requiredPermissions ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, err := UserFromContext(c)
		if err != nil {
			return utils.ErrUnauthorized("Unauthorized.", err)
		}

		for _, perm := range requiredPermissions {
			if _, hasPerm := user.Permissions[perm]; hasPerm {
				c.Locals("permission", perm)
				return c.Next()
			}
		}

		return utils.ErrForbidden("Permission denied.", nil)
	}
}

// RoleGuard restricts a route to a single account segment (admin/tutor/user).
func RoleGuard(required string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, err := UserFromContext(c)
		if err != nil {
			return utils.ErrUnauthorized("Unauthorized.", err)
		}
		if user.Role != required {
			return utils.ErrForbidden("Permission denied.", nil)
		}
		return c.Next()
	}
}

// ScopeGuard is for routes that mix "any authenticated user, self-scoped"
// with "elevated permission holder, sees everyone's data". It records the
// matched elevated permission in c.Locals("permission").
func ScopeGuard(elevatedPermissions ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, err := UserFromContext(c)
		if err != nil {
			return utils.ErrUnauthorized("Unauthorized.", err)
		}

		for _, perm := range elevatedPermissions {
			if _, hasPerm := user.Permissions[perm]; hasPerm {
				c.Locals("permission", perm)
				break
			}
		}

		return c.Next()
	}
}

// ResolveScope reads the elevated permission recorded by PermissionGuard/ScopeGuard
// and maps it to an AuthScope.
func ResolveScope(c *fiber.Ctx) generic.AuthScope {
	perm, _ := c.Locals("permission").(string)
	return generic.ScopeFromPermission(perm)
}
