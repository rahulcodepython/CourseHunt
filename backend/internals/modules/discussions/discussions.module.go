package discussions

import (
	"database/sql"
)

type DiscussionsModule struct {
	DB *sql.DB
}

func NewDiscussionsModule(db *sql.DB) *DiscussionsModule {
	return &DiscussionsModule{DB: db}
}
