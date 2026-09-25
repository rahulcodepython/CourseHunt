package notifications

import (
	"coursehunt/server/internals/generic"
)

func roleColumnFor(role string) (string, bool) {
	switch role {
	case generic.RoleAdmin:
		return "is_admin", true
	case generic.RoleTutor:
		return "is_tutor", true
	default:
		return "", false
	}
}
