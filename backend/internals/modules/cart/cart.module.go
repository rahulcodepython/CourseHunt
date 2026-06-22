package cart

import (
	"database/sql"
)

type CartModule struct {
	DB *sql.DB
}

func NewCartModule(db *sql.DB) *CartModule {
	return &CartModule{DB: db}
}
