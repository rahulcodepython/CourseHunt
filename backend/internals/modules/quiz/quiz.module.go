package quiz

import (
	"database/sql"
)

type QuizModule struct {
	DB *sql.DB
}

func NewQuizModule(db *sql.DB) *QuizModule {
	return &QuizModule{DB: db}
}
