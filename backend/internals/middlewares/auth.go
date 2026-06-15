package middlewares

import (
	"context"
	"fmt"
	"slices"
	"strings"
	"time"

	"coursehunt-backend/internals/config"
	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/lestrrat-go/jwx/v2/jwt"
)

// =============================================================================
// Types
// =============================================================================

// UserContext holds the authenticated user's identity, extracted from the JWT.
// It is stored in Fiber's request-scoped locals under the key "user".
type UserContext struct {
	UserID      string   `json:"user_id"`
	Email       string   `json:"email"`
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
}

// =============================================================================
// JWKS Cache
// =============================================================================

// jwksCache is the package-level, auto-refreshing JWKS key cache.
// It is initialized once via InitJWKSCache and reused across all requests.
var jwksCache *jwk.Cache

// InitJWKSCache initializes a background-refreshing JWKS cache for the given URL.
// This must be called once at application startup before any auth middleware is used.
func InitJWKSCache(jwksURL string) {
	jwksCache = jwk.NewCache(context.Background())
	err := jwksCache.Register(jwksURL, jwk.WithMinRefreshInterval(15*time.Minute))
	if err != nil {
		panic("Failed to register JWKS cache: " + err.Error())
	}
}

// fetchKeySet retrieves the current JWK key set from the cache.
// Returns an error if the cache has not been initialized or the fetch fails.
func fetchKeySet(ctx context.Context, jwksURL string) (jwk.Set, error) {
	if jwksCache == nil {
		return nil, fmt.Errorf("JWKS cache is not initialized; call InitJWKSCache first")
	}
	return jwksCache.Get(ctx, jwksURL)
}

// =============================================================================
// Token Parsing
// =============================================================================

// parseToken validates the raw JWT string against the given key set.
// Returns the parsed token or an error if validation fails.
func parseToken(tokenBytes []byte, keySet jwk.Set) (jwt.Token, error) {
	return jwt.Parse(tokenBytes,
		jwt.WithKeySet(keySet),
		jwt.WithValidate(true), // enforces expiry, nbf, and other standard claims
		jwt.WithAcceptableSkew(time.Minute),
	)
}

// =============================================================================
// Claim Extraction
// =============================================================================

// extractStringSlice safely reads a []string from a JWT private claim.
// Returns an empty slice when the claim is absent or of an unexpected type.
func extractStringSlice(token jwt.Token, key string) []string {
	raw, ok := token.Get(key)
	if !ok {
		return []string{}
	}

	// Better-Auth encodes arrays as []interface{}
	rawSlice, ok := raw.([]interface{})
	if !ok {
		return []string{}
	}

	result := make([]string, 0, len(rawSlice))
	for _, v := range rawSlice {
		if s, ok := v.(string); ok {
			result = append(result, s)
		}
	}
	return result
}

// extractUserContext builds a UserContext from a validated JWT token.
func extractUserContext(token jwt.Token) UserContext {
	var email string
	if raw, ok := token.Get("email"); ok {
		email = fmt.Sprintf("%v", raw)
	}

	return UserContext{
		UserID:      token.Subject(),
		Email:       email,
		Roles:       extractStringSlice(token, "roles"),
		Permissions: extractStringSlice(token, "permissions"),
	}
}

// =============================================================================
// Core Auth Middleware
// =============================================================================

// BaseAuthMiddleware validates the JWT found in the Authorization header and
// populates c.Locals("user") with a UserContext on success.
//
// This middleware must be mounted before any guard.
// It does NOT enforce a specific permission — use PermissionGuard for that.
func BaseAuthMiddleware(cfg *config.Config) fiber.Handler {
	// Initialize cache if it hasn't been initialized yet
	if jwksCache == nil {
		InitJWKSCache(cfg.JWKSURL)
	}

	return func(c *fiber.Ctx) error {
		// Step 1: Extract raw token from the Authorization header.
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return utils.Unauthorized(c, "Authorization header missing")
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return utils.Unauthorized(c, "Authorization header format must be Bearer {token}")
		}

		tokenString := parts[1]

		// Step 2: Fetch the current JWKS key set from the in-memory cache.
		keySet, err := fetchKeySet(c.Context(), cfg.JWKSURL)
		if err != nil {
			return utils.InternalError(c, "Failed to fetch signing keys")
		}

		// Step 3: Parse and validate the JWT signature, expiry, and claims.
		token, err := parseToken([]byte(tokenString), keySet)
		if err != nil {
			return utils.Unauthorized(c, "Invalid or expired token: "+err.Error())
		}

		// Step 4: Extract user context from the token and store it.
		c.Locals("user", extractUserContext(token))

		return c.Next()
	}
}

// PermissionGuard restricts access to users who have the specified permission
// embedded in their JWT payload. Use this instead of the old RoleGuard.
//
// Example:
//
//	routes.Post("/courses", middlewares.PermissionGuard("courses:create"), handler)
func PermissionGuard(requiredPermission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, ok := c.Locals("user").(UserContext)
		if !ok {
			return utils.Unauthorized(c, "Unauthorized")
		}

		if !slices.Contains(user.Permissions, requiredPermission) {
			return c.Status(fiber.StatusForbidden).
				JSON(fiber.Map{"error": "Permission denied: " + requiredPermission + " required"})
		}

		return c.Next()
	}
}
