package updates

import (
	"coursehunt/api/internals/pkg/cache"

	"github.com/jmoiron/sqlx"
)

type UpdatesModule struct {
	DB    *sqlx.DB
	Cache *cache.Cache
}

func NewUpdatesModule(db *sqlx.DB, cache *cache.Cache) *UpdatesModule {
	return &UpdatesModule{DB: db, Cache: cache}
}
