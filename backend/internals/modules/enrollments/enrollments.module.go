package enrollments

import (
	"database/sql"
)

type EnrollmentsModule struct {
	DB *sql.DB
}

func NewEnrollmentsModule(db *sql.DB) *EnrollmentsModule {
	return &EnrollmentsModule{DB: db}
}
