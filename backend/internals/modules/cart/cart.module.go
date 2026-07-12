package cart

import "github.com/jmoiron/sqlx"

type CartModule struct {
	DB *sqlx.DB
}

func NewCartModule(db *sqlx.DB) *CartModule {
	return &CartModule{DB: db}
}
