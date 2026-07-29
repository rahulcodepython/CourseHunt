package enrollments

import (
	"github.com/jmoiron/sqlx"
)

type EnrollmentsModule struct {
	DB *sqlx.DB
}

func NewEnrollmentsModule(db *sqlx.DB) *EnrollmentsModule {
	return &EnrollmentsModule{DB: db}
}
