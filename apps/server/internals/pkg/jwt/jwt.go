package jwt

import (
	"context"
	"errors"

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
	kf, err := keyfunc.NewDefaultCtx(ctx, []string{jwksURL})
	if err != nil {
		return nil, err
	}
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
