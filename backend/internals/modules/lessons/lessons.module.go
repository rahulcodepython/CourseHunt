package lessons

import (
	"database/sql"
)

type LessonsModule struct {
	DB *sql.DB
}

func NewLessonsModule(db *sql.DB) *LessonsModule {
	return &LessonsModule{
		DB: db,
	}
}
