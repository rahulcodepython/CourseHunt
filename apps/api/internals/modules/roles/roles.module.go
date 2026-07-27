package roles

import (
	"coursehunt/api/internals/pkg/cache"

	"github.com/jmoiron/sqlx"
)

type RolesModule struct {
	DB    *sqlx.DB
	Cache *cache.Cache
}

func NewRolesModule(db *sqlx.DB, cache *cache.Cache) *RolesModule {
	return &RolesModule{DB: db, Cache: cache}
}
