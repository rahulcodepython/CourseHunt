package notifications

import (
	"coursehunt/server/internals/config"

	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	DB  *pgxpool.Pool
	Cfg *config.Config
}

func New(db *pgxpool.Pool, cfg *config.Config) *App {
	return &App{DB: db, Cfg: cfg}
}
