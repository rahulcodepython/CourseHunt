package category

import "github.com/jmoiron/sqlx"

type CategoryModule struct {
	DB *sqlx.DB
}

func NewCategoryModule(db *sqlx.DB) *CategoryModule {
	return &CategoryModule{DB: db}
}
