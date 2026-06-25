package category

import (
	"database/sql"
)

type CategoryModule struct {
	DB *sql.DB
}

func NewCategoryModule(db *sql.DB) *CategoryModule {
	return &CategoryModule{DB: db}
}
