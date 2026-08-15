package middlewares

import (
	"context"
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/repositories"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// ── JWKS fetch + cache ──
//
// Keys are cached in-process first, then in Redis, then fetched from the
// admin app's JWKS endpoint (see apps/admin/src/app/api/auth/[...all]/route.ts).

type JWKSKey struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	Use string `json:"use"`
	Alg string `json:"alg"`
	Crv string `json:"crv"`
	X   string `json:"x"`
}

type JWKSResponse struct {
	Keys []JWKSKey `json:"keys"`
}

type jwksStore struct {
	mu        sync.RWMutex
	keys      []JWKSKey
	fetchedAt time.Time
	ttl       time.Duration
}

func (s *jwksStore) get() ([]JWKSKey, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if len(s.keys) == 0 || time.Since(s.fetchedAt) >= s.ttl {
		return nil, false
	}
	return s.keys, true
}

func (s *jwksStore) set(keys []JWKSKey) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.keys = keys
	s.fetchedAt = time.Now()
}

var store = &jwksStore{ttl: 10 * time.Minute}

func fetchJWKS(ctx context.Context, cch *cache.Cache, jwksURL string) ([]JWKSKey, error) {
	if keys, ok := store.get(); ok {
		return keys, nil
	}

	if cch != nil {
		if cached, found := cch.GetGraceTokens(ctx, generic.JWKSRedisCacheKey); found {
			var keys []JWKSKey
			if err := json.Unmarshal([]byte(cached.AccessToken), &keys); err == nil && len(keys) > 0 {
				store.set(keys)
				return keys, nil
			}
		}
	}

	keys, err := fetchJWKSFromEndpoint(ctx, jwksURL)
	if err != nil {
		return nil, err
	}
	store.set(keys)

	if cch != nil && len(keys) > 0 {
		if raw, err := json.Marshal(keys); err == nil {
			cch.SetGraceTokens(ctx, generic.JWKSRedisCacheKey, &cache.GraceTokenPayload{AccessToken: string(raw)})
		}
	}

	return keys, nil
}

func fetchJWKSFromEndpoint(ctx context.Context, jwksURL string) ([]JWKSKey, error) {
	client := &http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, jwksURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch JWKS from %s: status %d", jwksURL, resp.StatusCode)
	}

	var jwks JWKSResponse
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, err
	}
	return jwks.Keys, nil
}

// publicKeyFromJWK converts a JWK "x" field (base64url raw Ed25519 public key)
// into an ed25519.PublicKey usable by jwt.SigningMethodEdDSA.
func publicKeyFromJWK(key JWKSKey) (ed25519.PublicKey, error) {
	if key.Crv != "Ed25519" {
		return nil, fmt.Errorf("unsupported curve %q", key.Crv)
	}
	raw, err := base64.RawURLEncoding.DecodeString(key.X)
	if err != nil {
		return nil, err
	}
	if len(raw) != ed25519.PublicKeySize {
		return nil, fmt.Errorf("invalid Ed25519 public key length %d", len(raw))
	}
	return ed25519.PublicKey(raw), nil
}

// ── JWT parsing ──

func parseAndValidateJWT(ctx context.Context, cch *cache.Cache, cfg *config.Config, tokenString string) (*generic.UserClaims, error) {
	keys, err := fetchJWKS(ctx, cch, cfg.JWKSURL)
	if err != nil {
		return nil, err
	}
	if len(keys) == 0 {
		return nil, generic.ErrAuthEmptyJWKS
	}

	token, err := jwt.ParseWithClaims(tokenString, &generic.UserClaims{}, func(token *jwt.Token) (interface{}, error) {
		if token.Method != jwt.SigningMethodEdDSA {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		kid, _ := token.Header["kid"].(string)
		for _, key := range keys {
			if kid != "" && key.Kid != "" && key.Kid != kid {
				continue
			}
			if pub, err := publicKeyFromJWK(key); err == nil {
				return pub, nil
			}
		}
		return nil, generic.ErrAuthNoMatchingKey
	})
	if err != nil || !token.Valid {
		return nil, generic.ErrAuthInvalidToken
	}

	claims, ok := token.Claims.(*generic.UserClaims)
	if !ok {
		return nil, generic.ErrAuthInvalidClaims
	}
	if claims.Banned {
		return nil, generic.ErrAuthUserBanned
	}

	return claims, nil
}

func setUserContext(c *fiber.Ctx, userID string, roles []string, permissions []string) {
	perms := make(map[string]struct{}, len(permissions))
	for _, p := range permissions {
		perms[p] = struct{}{}
	}

	c.Locals("user", &generic.UserContext{
		UserID:      userID,
		Roles:       roles,
		Permissions: perms,
	})
}

// extractToken reads the JWT from the Authorization header first, falling
// back to the configured auth cookie (both are populated by the admin app —
// see apps/admin/src/lib/auth-client.ts).
func extractToken(c *fiber.Ctx, cfg *config.Config) string {
	if auth := c.Get("Authorization"); strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	return c.Cookies(cfg.AuthCookieName)
}

// ── Middleware ──

func BaseAuthMiddleware(cfg *config.Config, cch *cache.Cache, usersRepo *repositories.UsersRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := extractToken(c, cfg)
		if token == "" {
			return utils.Unauthorized(c, "Authorization token missing or session expired.", generic.ErrAuthTokenMissing)
		}

		claims, err := parseAndValidateJWT(c.Context(), cch, cfg, token)
		if err != nil {
			return utils.Unauthorized(c, "Authorization token missing or session expired.", err)
		}

		// JWT permissions are a snapshot taken at token mint time (7-day
		// lifetime), so a token can outlive role/permission changes in the DB
		// and produce false 403s. Resolve the user's current roles/permissions
		// from the database on every request, falling back to the token claims
		// if the lookup fails so auth never breaks on a transient DB error.
		roles := claims.Roles
		permissions := claims.Permissions
		if usersRepo != nil && claims.Subject != "" {
			if fresh, err := usersRepo.GetRolesAndPermissions(claims.Subject); err == nil {
				roles = fresh.Roles
				permissions = fresh.Permissions
			}
		}

		setUserContext(c, claims.Subject, roles, permissions)
		return c.Next()
	}
}

func PermissionGuard(requiredPermissions ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, ok := c.Locals("user").(*generic.UserContext)
		if !ok || user == nil {
			return utils.Unauthorized(c, "Unauthorized.", generic.ErrAuthNoUserContext)
		}

		for _, perm := range requiredPermissions {
			if _, hasPerm := user.Permissions[perm]; hasPerm {
				c.Locals("permission", perm)
				return c.Next()
			}
		}

		return utils.Forbidden(c, "Permission denied.", nil)
	}
}
