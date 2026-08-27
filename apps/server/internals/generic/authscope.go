package generic

import "strings"

type AuthScope string

const (
	ScopeAdmin AuthScope = "admin"
	ScopeTutor AuthScope = "tutor"
	ScopeUser  AuthScope = "user"
)

type AuthError struct {
	Status  int
	Message string
}

func ScopeFromPermission(permission string) AuthScope {
	switch {
	case strings.HasPrefix(permission, "admin:"):
		return ScopeAdmin
	case strings.HasPrefix(permission, "tutor:"):
		return ScopeTutor
	default:
		return ScopeUser
	}
}

func AuthErrorForScope(_ AuthScope, err error) *AuthError {
	if err == nil {
		return nil
	}
	return &AuthError{Status: 403, Message: err.Error()}
}
