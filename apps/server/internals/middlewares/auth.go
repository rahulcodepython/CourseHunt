package middlewares

import (
	"context"
	"strings"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/pkg/jwt"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// authCacheTTL bounds how stale a cached roles/permissions lookup can be —
// short enough that a ban or permission change (neither of which explicitly
// invalidates every possible cache entry) still takes effect quickly.
const authCacheTTL = 60 * time.Second

// UsersLookup is the narrow callback BaseAuthMiddleware needs into the users
// feature — declared here instead of importing internals/features/users
// directly, since that package's routes.go imports this middlewares package
// (PermissionGuard), and middlewares importing it back would cycle.
type UsersLookup interface {
	GetRolesAndPermissions(ctx context.Context, userID string) (generic.RolesAndPermissionsResult, error)
}

// BaseAuthMiddleware verifies the bearer JWT issued by better-auth and populates
// the authenticated UserContext on the Fiber request context. verifier is
// constructed once at startup (cmd/server/main.go) since it holds a
// background refresh goroutine for the JWKS keyset, and passed in here like
// every other dependency rather than held as package-level state.
func BaseAuthMiddleware(cfg *config.Config, cch *cache.Cache, usersRepo UsersLookup, verifier *jwt.Verifier) fiber.Handler {
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

		// Banned is checked below, once, against the fresh DB/cache lookup —
		// not here against claims.Banned. Checking the JWT's baked-in value
		// here would reject a since-unbanned user for the rest of their
		// session (their token was minted while banned == true, and this app
		// fetches a JWT once on page load and holds it in memory), even
		// though the fresh lookup a few lines down would show they're clear.
		if claims.MustChangePassword {
			return utils.ErrUnauthorized("Password change required before API access.", generic.ErrAuthMustChangePassword)
		}

		role := claims.Role
		roles := claims.Roles
		var permissions []string
		banned := claims.Banned

		if usersRepo != nil && claims.Subject != "" {
			cacheKey := cache.AuthCacheKey(claims.Subject)

			var cached generic.RolesAndPermissionsResult
			if hit, _ := cch.Get(c.Context(), cacheKey, &cached); hit {
				role, roles, permissions, banned = cached.Role, cached.Roles, cached.Permissions, cached.Banned
			} else if fresh, err := usersRepo.GetRolesAndPermissions(c.Context(), claims.Subject); err == nil {
				role, roles, permissions, banned = fresh.Role, fresh.Roles, fresh.Permissions, fresh.Banned
				_ = cch.Set(c.Context(), cacheKey, fresh, authCacheTTL)
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

// PermissionGuard restricts a route to callers holding the specified permission.
func PermissionGuard(requiredPermission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, err := UserFromContext(c)
		if err != nil {
			return utils.ErrUnauthorized("Unauthorized.", err)
		}

		if _, hasPerm := user.Permissions[requiredPermission]; hasPerm {
			return c.Next()
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
