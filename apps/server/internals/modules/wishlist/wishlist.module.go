package wishlist

import (
	"coursehunt/api/internals/pkg/cache"

	"github.com/jmoiron/sqlx"
)

type WishlistModule struct {
	DB    *sqlx.DB
	Cache *cache.Cache
}

func NewWishlistModule(db *sqlx.DB, cache *cache.Cache) *WishlistModule {
	return &WishlistModule{DB: db, Cache: cache}
}
