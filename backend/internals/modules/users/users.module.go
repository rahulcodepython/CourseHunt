package users

import (
	"github.com/jmoiron/sqlx"
)

type UsersModule struct {
	DB *sqlx.DB
}

func NewUsersModule(db *sqlx.DB) *UsersModule {
	return &UsersModule{DB: db}
}
