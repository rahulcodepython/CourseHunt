package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func generateRandomToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

func (m *AuthModule) generateJWT(user *User) (string, error) {
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
	return token.SignedString([]byte(m.Cfg.JWTSecret))
}

func (m *AuthModule) setCookies(c *fiber.Ctx, accessToken, refreshToken string) {
	c.Cookie(&fiber.Cookie{
		Name:     m.Cfg.AuthCookieName,
		Value:    accessToken,
		Path:     "/",
		Domain:   m.Cfg.CookieDomain,
		MaxAge:   15 * 60,
		Secure:   m.Cfg.CookieSecure,
		HTTPOnly: false,
		SameSite: "Lax",
	})

	c.Cookie(&fiber.Cookie{
		Name:     m.Cfg.RefreshCookieName,
		Value:    refreshToken,
		Path:     "/api/v1/auth",
		Domain:   m.Cfg.CookieDomain,
		MaxAge:   7 * 24 * 60 * 60,
		Secure:   m.Cfg.CookieSecure,
		HTTPOnly: true,
		SameSite: "Lax",
	})
}

func (m *AuthModule) clearCookies(c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     m.Cfg.AuthCookieName,
		Value:    "",
		Path:     "/",
		Domain:   m.Cfg.CookieDomain,
		Expires:  time.Now().Add(-1 * time.Hour),
		Secure:   m.Cfg.CookieSecure,
		HTTPOnly: false,
		SameSite: "Lax",
	})
	c.Cookie(&fiber.Cookie{
		Name:     m.Cfg.RefreshCookieName,
		Value:    "",
		Path:     "/api/v1/auth",
		Domain:   m.Cfg.CookieDomain,
		Expires:  time.Now().Add(-1 * time.Hour),
		Secure:   m.Cfg.CookieSecure,
		HTTPOnly: true,
		SameSite: "Lax",
	})
}
