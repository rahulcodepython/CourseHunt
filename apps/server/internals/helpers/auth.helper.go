package helpers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func GenerateRandomToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func HashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

func GenerateJWT(cfg *config.Config, user *entities.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":               user.ID,
		"email":             user.Email,
		"roles":             user.Roles,
		"permissions":       user.Permissions,
		"banned":            user.Banned,
		"passwordChangedAt": user.PasswordChangedAt,
		"iat":               time.Now().Unix(),
		"exp":               time.Now().Add(15 * time.Minute).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecret))
}

func SetCookies(cfg *config.Config, c *fiber.Ctx, accessToken, refreshToken string) {
	c.Cookie(&fiber.Cookie{
		Name:     cfg.AuthCookieName,
		Value:    accessToken,
		Path:     "/",
		Domain:   cfg.CookieDomain,
		MaxAge:   15 * 60,
		Secure:   cfg.CookieSecure,
		HTTPOnly: false,
		SameSite: "Lax",
	})

	c.Cookie(&fiber.Cookie{
		Name:     cfg.RefreshCookieName,
		Value:    refreshToken,
		Path:     "/api/v1/auth",
		Domain:   cfg.CookieDomain,
		MaxAge:   7 * 24 * 60 * 60,
		Secure:   cfg.CookieSecure,
		HTTPOnly: true,
		SameSite: "Lax",
	})
}

func ClearCookies(cfg *config.Config, c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     cfg.AuthCookieName,
		Value:    "",
		Path:     "/",
		Domain:   cfg.CookieDomain,
		Expires:  time.Now().Add(-1 * time.Hour),
		Secure:   cfg.CookieSecure,
		HTTPOnly: false,
		SameSite: "Lax",
	})
	c.Cookie(&fiber.Cookie{
		Name:     cfg.RefreshCookieName,
		Value:    "",
		Path:     "/api/v1/auth",
		Domain:   cfg.CookieDomain,
		Expires:  time.Now().Add(-1 * time.Hour),
		Secure:   cfg.CookieSecure,
		HTTPOnly: true,
		SameSite: "Lax",
	})
}
