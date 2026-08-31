package upload

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/pkg/minio"
)

// upload has no owned table: it's a thin wrapper around the object storage
// client for generating short-lived signed upload URLs.
type App struct {
	Cfg     *config.Config
	Storage *minio.Storage
}

func New(cfg *config.Config, storage *minio.Storage) *App {
	return &App{Cfg: cfg, Storage: storage}
}
