package monitoring

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/pkg/minio"

	"github.com/jackc/pgx/v5/pgxpool"
)

// monitoring merges the old "health" and "monitoring" controllers: neither
// owned a table, and monitoring's snapshot already called health's
// CheckServices directly — now a same-package call (monitoring.checks.go).
type App struct {
	DB      *pgxpool.Pool
	Cache   *cache.Cache
	Cfg     *config.Config
	Storage *minio.Storage
}

func New(db *pgxpool.Pool, cch *cache.Cache, cfg *config.Config, storage *minio.Storage) *App {
	return &App{DB: db, Cache: cch, Cfg: cfg, Storage: storage}
}
