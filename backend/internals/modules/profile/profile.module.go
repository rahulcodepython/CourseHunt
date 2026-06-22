package profile

import (
	"database/sql"

	"coursehunt-backend/internals/modules/users"
)

// ProfileModule depends on users package for UserProfile and TutorProfile types.
type ProfileModule struct {
	DB    *sql.DB
	Users *users.UsersModule
}

func NewProfileModule(db *sql.DB) *ProfileModule {
	return &ProfileModule{
		DB:    db,
		Users: users.NewUsersModule(db),
	}
}
