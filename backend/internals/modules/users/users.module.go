package users

import (
	"database/sql"
)

type UsersModule struct {
	DB *sql.DB
}

func NewUsersModule(db *sql.DB) *UsersModule {
	return &UsersModule{DB: db}
}
