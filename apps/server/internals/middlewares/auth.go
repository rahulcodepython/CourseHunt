package middlewares

import (
	"errors"
	"fmt"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/helpers"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/services"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func parseAndValidateJWT(cfg *config.Config, tokenString string) (*generic.UserClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &generic.UserClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(cfg.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid or expired token")
	}

	claims, ok := token.Claims.(*generic.UserClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	if claims.Banned {
		return nil, errors.New("account is banned")
	}

	return claims, nil
}

func setUserContext(c *fiber.Ctx, claims *generic.UserClaims) {
	permissionSet := make(map[string]struct{}, len(claims.Permissions))
	for _, p := range claims.Permissions {
		permissionSet[p] = struct{}{}
	}

	c.Locals("user", &generic.UserContext{
		UserID:      claims.Subject,
		Roles:       claims.Roles,
		Permissions: permissionSet,
	})
}

func BaseAuthMiddleware(cfg *config.Config, authSvc *services.AuthService, cch *cache.Cache) fiber.Handler {
	return func(c *fiber.Ctx) error {
		accessToken := c.Cookies(cfg.AuthCookieName)
		refreshToken := c.Cookies(cfg.RefreshCookieName)

		// 1. FAST PATH: Access Token is valid
		if accessToken != "" {
			claims, err := parseAndValidateJWT(cfg, accessToken)
			if err == nil {
				setUserContext(c, claims)
				return c.Next()
			}
		}

		// 2. AUTO-REFRESH PATH: Access Token missing/expired, but Refresh Token is present
		if refreshToken != "" {
			// A. Check Redis Grace Cache first (Parallel Request handling)
			if gracePayload, found := cch.GetGraceTokens(c.Context(), refreshToken); found {
				helpers.SetCookies(cfg, c, gracePayload.AccessToken, gracePayload.RefreshToken)
				if claims, err := parseAndValidateJWT(cfg, gracePayload.AccessToken); err == nil {
					setUserContext(c, claims)
					return c.Next()
				}
			}

			// B. Acquire Redis Lock for Rotation
			lockKey := helpers.HashToken(refreshToken)
			locked, _ := cch.AcquireLock(c.Context(), lockKey)
			if !locked {
				// Another parallel request is rotating right now! Wait 100ms and check Grace Cache again
				time.Sleep(100 * time.Millisecond)
				if gracePayload, found := cch.GetGraceTokens(c.Context(), refreshToken); found {
					helpers.SetCookies(cfg, c, gracePayload.AccessToken, gracePayload.RefreshToken)
					if claims, err := parseAndValidateJWT(cfg, gracePayload.AccessToken); err == nil {
						setUserContext(c, claims)
						return c.Next()
					}
				}
			} else {
				defer cch.ReleaseLock(c.Context(), lockKey)
			}

			// C. Rotate Token Session in DB
			resp, newRefreshToken, err := authSvc.RefreshTokenService(refreshToken)
			if err == nil && resp != nil {
				// D. Save in Redis Grace Cache for 30s
				cch.SetGraceTokens(c.Context(), refreshToken, &cache.GraceTokenPayload{
					AccessToken:  resp.AccessToken,
					RefreshToken: newRefreshToken,
				})

				// E. Write new HTTP-only cookies to Response
				helpers.SetCookies(cfg, c, resp.AccessToken, newRefreshToken)

				// F. Parse & Set Context
				if claims, err := parseAndValidateJWT(cfg, resp.AccessToken); err == nil {
					setUserContext(c, claims)
					return c.Next()
				}
			}
		}

		// 3. FALLBACK: Unauthorized
		helpers.ClearCookies(cfg, c)
		return utils.Unauthorized(c, "Authorization token missing or session expired.", errors.New("unauthorized"))
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
