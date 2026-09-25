package roles

import "coursehunt/server/internals/generic"

// isSystemRoleName reports whether name collides with one of the three
// fixed account-segment roles, which can never be created/modified/deleted
// as a custom role.
func isSystemRoleName(name string) bool {
	systemRoles := map[string]bool{generic.RoleAdmin: true, generic.RoleTutor: true, generic.RoleUser: true}
	return systemRoles[name]
}
