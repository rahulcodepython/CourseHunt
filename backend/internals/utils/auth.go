package utils

import (
	"strings"
	"time"

	"coursehunt-backend/internals/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

const SessionCookieName = "session_id"

type AuthClaims struct {
	Email string `json:"email"`
	Position string `json:"position"`
	jwt.RegisteredClaims
}

// TokenFromRequest returns the bearer token or legacy session cookie token.
func TokenFromRequest(c *fiber.Ctx) string {
	authHeader := c.Get("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1]
		}
	}

	return c.Cookies(SessionCookieName)
}

// ParseAuthToken validates the JWT and returns the typed auth claims.
func ParseAuthToken(tokenString string, secret string) (*AuthClaims, error) {
	claims := &AuthClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, jwt.ErrTokenInvalidClaims
	}

	return claims, nil
}

// GenerateAuthToken signs a JWT for the authenticated user.
func GenerateAuthToken(user *models.User, secret string, lifetime time.Duration) (string, error) {
	claims := AuthClaims{
		Email: user.Email,
		Position: user.Position,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(lifetime)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
