package feedbacks

import (
	"database/sql"
)

type FeedbacksModule struct {
	DB *sql.DB
}

func NewFeedbacksModule(db *sql.DB) *FeedbacksModule {
	return &FeedbacksModule{DB: db}
}
