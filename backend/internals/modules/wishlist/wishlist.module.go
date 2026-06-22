package wishlist

import (
	"database/sql"
)

type WishlistModule struct {
	DB *sql.DB
}

func NewWishlistModule(db *sql.DB) *WishlistModule {
	return &WishlistModule{DB: db}
}
