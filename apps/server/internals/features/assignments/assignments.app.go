package assignments

import (
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/pkg/minio"

	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	DB      *pgxpool.Pool
	Cache   *cache.Cache
	Storage *minio.Storage
}

func New(db *pgxpool.Pool, c *cache.Cache, storage *minio.Storage) *App {
	return &App{
		DB:      db,
		Cache:   c,
		Storage: storage,
	}
}
