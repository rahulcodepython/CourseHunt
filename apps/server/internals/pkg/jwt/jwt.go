package jwt

import (
	"context"
	"errors"

	"fmt"
	"log/slog"
	"net/http"
	"time"

	"coursehunt/server/internals/pkg/retry"

	"github.com/MicahParks/keyfunc/v3"
	extjwt "github.com/golang-jwt/jwt/v5"
)

var ErrInvalidToken = errors.New("jwt: invalid or expired token")

// Claims is the JWT payload shape produced by better-auth's jwt plugin.
type Claims struct {
	extjwt.RegisteredClaims
	Role               string   `json:"role"`
	Roles              []string `json:"roles"`
	Banned             bool     `json:"banned"`
	MustChangePassword bool     `json:"must_change_password"`
}

type Verifier struct {
	kf keyfunc.Keyfunc
}

// NewVerifier fetches the JWKS at jwksURL once and hands back a verifier
// backed by a keyset kept fresh for the lifetime of ctx.
func NewVerifier(ctx context.Context, jwksURL string) (*Verifier, error) {
	client := &http.Client{Timeout: 2 * time.Second}

	// Retry probe so the Go backend gracefully awaits Next.js boot instead of
	// logging an immediate connection refused error on dual startup.
	_ = retry.Connect("jwks", 5, 1*time.Second, func() error {
		req, reqErr := http.NewRequestWithContext(ctx, http.MethodGet, jwksURL, nil)
		if reqErr != nil {
			return reqErr
		}
		resp, respErr := client.Do(req)
		if respErr != nil {
			return respErr
		}
		defer resp.Body.Close()
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
		}
		return nil
	})

	kf, err := keyfunc.NewDefaultCtx(ctx, []string{jwksURL})
	if err != nil {
		return nil, err
	}
	slog.Info("connected to jwks", "url", jwksURL)
	return &Verifier{kf: kf}, nil
}

func (v *Verifier) Parse(tokenStr string) (*Claims, error) {
	claims := &Claims{}
	token, err := extjwt.ParseWithClaims(tokenStr, claims, v.kf.Keyfunc)
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}
	return claims, nil
}
