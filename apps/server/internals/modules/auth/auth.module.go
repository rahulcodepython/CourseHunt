package auth

import (
	"coursehunt/api/internals/config"

	"github.com/jmoiron/sqlx"
)

type AuthModule struct {
	DB  *sqlx.DB
	Cfg *config.Config
}

func NewAuthModule(db *sqlx.DB, cfg *config.Config) *AuthModule {
	return &AuthModule{DB: db, Cfg: cfg}
}
