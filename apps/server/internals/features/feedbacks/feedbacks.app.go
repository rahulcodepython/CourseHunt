package feedbacks

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/pkg/cache"

	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	DB    *pgxpool.Pool
	Cache *cache.Cache
	Cfg   *config.Config
}

func New(db *pgxpool.Pool, cch *cache.Cache, cfg *config.Config) *App {
	return &App{DB: db, Cache: cch, Cfg: cfg}
}
