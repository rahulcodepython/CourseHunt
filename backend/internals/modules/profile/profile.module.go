package profile

import (
	"coursehunt-backend/internals/modules/users"

	"github.com/jmoiron/sqlx"
)

type ProfileModule struct {
	DB    *sqlx.DB
	Users *users.UsersModule
}

func NewProfileModule(db *sqlx.DB) *ProfileModule {
	return &ProfileModule{
		DB:    db,
		Users: users.NewUsersModule(db),
	}
}
