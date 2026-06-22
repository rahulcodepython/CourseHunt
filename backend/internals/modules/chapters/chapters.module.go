package chapters

import (
	"database/sql"
)

type ChaptersModule struct {
	DB *sql.DB
}

func NewChaptersModule(db *sql.DB) *ChaptersModule {
	return &ChaptersModule{DB: db}
}
