package category

import (
	"coursehunt/api/internals/pkg/cache"

	"github.com/jmoiron/sqlx"
)

type CategoryModule struct {
	DB    *sqlx.DB
	Cache *cache.Cache
}

func NewCategoryModule(db *sqlx.DB, cache *cache.Cache) *CategoryModule {
	return &CategoryModule{DB: db, Cache: cache}
}
