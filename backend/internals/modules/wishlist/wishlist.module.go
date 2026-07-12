package wishlist

import (
	"github.com/jmoiron/sqlx"
)

type WishlistModule struct {
	DB *sqlx.DB
}

func NewWishlistModule(db *sqlx.DB) *WishlistModule {
	return &WishlistModule{DB: db}
}
