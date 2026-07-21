package generic

import "strings"

type AuthScope string

const (
	ScopeAdmin    AuthScope = "admin"
	ScopeTutor    AuthScope = "tutor"
	ScopeUser     AuthScope = "user"
	ScopeEnrolled AuthScope = "enrolled"
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
	case strings.HasPrefix(permission, "enrolled:"):
		return ScopeEnrolled
	case strings.HasPrefix(permission, "user:"):
		return ScopeUser
	default:
		return ScopeUser
	}
}

func AuthErrorForScope(scope AuthScope, err error) *AuthError {
	if err == nil {
		return nil
	}
	return &AuthError{Status: 403, Message: err.Error()}
}
